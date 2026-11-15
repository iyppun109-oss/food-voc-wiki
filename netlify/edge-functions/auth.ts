// FoodVOC 운영자 로그인 게이트 (Netlify Edge Function)
//
// 사이트의 모든 요청을 서버(엣지) 쪽에서 먼저 검사합니다.
// 로그인하지 않은 사용자에게는 앱 파일(JS·CSS·데이터)을 하나도 보내지 않고 로그인 화면만 보여 줍니다.
//
// 필요한 Netlify 환경 변수
//   FOODVOC_ADMIN_PASSWORD : 운영자 비밀번호 (필수, 저장소에 넣지 않습니다)
// 비밀번호를 바꾸면 기존 로그인 세션은 모두 자동으로 만료됩니다.

type EdgeContext = { next: () => Promise<Response> }

declare const Netlify: { env: { get: (key: string) => string | undefined } } | undefined

const LOGIN_PATH = '/__login'
const LOGOUT_PATH = '/__logout'
const COOKIE_NAME = 'fv_session'
const SESSION_SECONDS = 60 * 60 * 24 * 7 // 7일
const FAIL_DELAY_MS = 1000

const encoder = new TextEncoder()

function readPassword(): string | undefined {
  const value = typeof Netlify !== 'undefined' ? Netlify.env.get('FOODVOC_ADMIN_PASSWORD') : undefined
  return value && value.length > 0 ? value : undefined
}

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`foodvoc-session:${secret}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function safeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a)
  const right = encoder.encode(b)
  let diff = left.length ^ right.length
  const length = Math.max(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    diff |= (left[index] ?? 0) ^ (right[index] ?? 0)
  }
  return diff === 0
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie') ?? ''
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (rawKey === name) return rest.join('=')
  }
  return undefined
}

async function createSessionToken(password: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS
  return `${expiresAt}.${await hmacHex(password, String(expiresAt))}`
}

async function isValidSession(token: string | undefined, password: string): Promise<boolean> {
  if (!token) return false
  const [expiresRaw, signature] = token.split('.')
  const expiresAt = Number(expiresRaw)
  if (!signature || !Number.isFinite(expiresAt)) return false
  if (expiresAt < Math.floor(Date.now() / 1000)) return false
  return safeEqual(signature, await hmacHex(password, expiresRaw))
}

function sessionCookie(value: string, maxAge: number): string {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith(LOGIN_PATH)) return '/'
  return raw
}

function htmlResponse(body: string, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
      'x-frame-options': 'DENY',
      ...extraHeaders,
    },
  })
}

function pageShell(inner: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>FoodVOC 운영자 로그인</title>
<style>
  :root { color-scheme: light dark; --bg:#f4f6f8; --card:#fff; --text:#1f2933; --muted:#616e7c; --line:#d9e2ec; --accent:#1f7a5c; --error:#c62828; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111418; --card:#1b2026; --text:#e6e9ed; --muted:#9aa5b1; --line:#323a44; --accent:#3fb68b; --error:#ef6b6b; } }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:16px; background:var(--bg); color:var(--text); font-family: "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif; }
  .card { width:100%; max-width:360px; background:var(--card); border:1px solid var(--line); border-radius:14px; padding:28px 24px; }
  .badge { display:inline-flex; width:40px; height:40px; align-items:center; justify-content:center; border-radius:10px; background:var(--accent); color:#fff; font-weight:700; }
  h1 { font-size:20px; margin:14px 0 4px; }
  p { margin:0 0 18px; color:var(--muted); font-size:14px; line-height:1.5; }
  label { display:block; font-size:14px; margin-bottom:6px; }
  input { width:100%; padding:12px; font-size:16px; border:1px solid var(--line); border-radius:8px; background:transparent; color:var(--text); }
  button { width:100%; margin-top:14px; padding:12px; font-size:16px; font-weight:600; border:0; border-radius:8px; background:var(--accent); color:#fff; cursor:pointer; }
  .error { color:var(--error); font-size:14px; margin:10px 0 0; }
</style>
</head>
<body>
<main class="card">
<span class="badge" aria-hidden="true">FV</span>
${inner}
</main>
</body>
</html>`
}

function loginPage(next: string, errorMessage?: string): string {
  return pageShell(`<h1>운영자 로그인</h1>
<p>FoodVOC는 승인된 운영자만 사용할 수 있습니다. 비밀번호를 입력해 주세요.</p>
<form method="post" action="${LOGIN_PATH}">
<input type="hidden" name="next" value="${escapeHtml(next)}">
<label for="password">비밀번호</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
${errorMessage ? `<p class="error" role="alert">${escapeHtml(errorMessage)}</p>` : ''}
<button type="submit">로그인</button>
</form>`)
}

function notConfiguredPage(): string {
  return pageShell(`<h1>접속 준비 중</h1>
<p>운영자 비밀번호가 아직 설정되지 않아 사이트를 열 수 없습니다. 관리자에게 문의해 주세요.</p>`)
}

function redirect(location: string, extraHeaders: Record<string, string> = {}): Response {
  return new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store', ...extraHeaders } })
}

export default async function auth(request: Request, context: EdgeContext): Promise<Response> {
  const url = new URL(request.url)
  const password = readPassword()

  // 비밀번호가 설정되지 않았으면 사이트를 열지 않습니다(실수로 공개되는 것 방지).
  if (!password) return htmlResponse(notConfiguredPage(), 503)

  if (url.pathname === LOGOUT_PATH) {
    return redirect(LOGIN_PATH, { 'set-cookie': sessionCookie('', 0) })
  }

  if (url.pathname === LOGIN_PATH) {
    if (request.method === 'POST') {
      const form = await request.formData().catch(() => null)
      const submitted = String(form?.get('password') ?? '')
      const next = safeNextPath(String(form?.get('next') ?? '/'))
      if (submitted && safeEqual(submitted, password)) {
        return redirect(next, { 'set-cookie': sessionCookie(await createSessionToken(password), SESSION_SECONDS) })
      }
      await new Promise((resolve) => setTimeout(resolve, FAIL_DELAY_MS))
      return htmlResponse(loginPage(next, '비밀번호가 올바르지 않습니다.'), 401)
    }
    if (await isValidSession(readCookie(request, COOKIE_NAME), password)) return redirect('/')
    return htmlResponse(loginPage(safeNextPath(url.searchParams.get('next'))), 200)
  }

  if (await isValidSession(readCookie(request, COOKIE_NAME), password)) {
    const upstream = await context.next()
    const response = new Response(upstream.body, upstream)
    response.headers.set('x-robots-tag', 'noindex, nofollow')
    return response
  }

  // 페이지 이동 요청은 로그인 화면으로, 그 밖의 파일 요청은 401로 막습니다.
  const accept = request.headers.get('accept') ?? ''
  if (request.method === 'GET' && accept.includes('text/html')) {
    const next = `${url.pathname}${url.search}`
    return redirect(`${LOGIN_PATH}?next=${encodeURIComponent(next)}`)
  }
  return new Response('Unauthorized', { status: 401, headers: { 'cache-control': 'no-store' } })
}

export const config = { path: '/*' }
