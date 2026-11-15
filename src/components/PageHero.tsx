export type HeroTone = 'tomato' | 'leaf' | 'amber'

export interface HeroStat {
  value: string
  unit?: string
  label: string
}

interface PageHeroProps {
  eyebrow: string
  title: string
  description: string
  /** 화면이 좁아 설명을 숨겨도 남겨 둘 업무상 단서 */
  note?: string
  stats?: HeroStat[]
  tone: HeroTone
}

/** 화면 머리 띠: 큰 제목, 한 줄 설명, 핵심 숫자, 식판·그릇 그림 */
export function PageHero({ eyebrow, title, description, note, stats = [], tone }: PageHeroProps) {
  return (
    <header className={`page-hero page-hero--${tone}`}>
      <div className="page-hero__body">
        <p className="page-hero__eyebrow">{eyebrow}</p>
        <h1 className="page-hero__title">{title}</h1>
        <p className="page-hero__desc">{description}</p>
        {note && <p className="page-hero__note">{note}</p>}
        {stats.length > 0 && (
          <dl className="page-hero__stats">
            {stats.map((stat) => (
              <div className="page-hero__stat" key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>
                  {stat.value}
                  {stat.unit && <span>{stat.unit}</span>}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <HeroArt tone={tone} />
    </header>
  )
}

function HeroArt({ tone }: { tone: HeroTone }) {
  if (tone === 'leaf') {
    // 접시 위 채소와 잎
    return (
      <svg className="page-hero__art" viewBox="0 0 200 160" aria-hidden="true">
        <ellipse cx="100" cy="132" rx="78" ry="12" className="art-shadow" />
        <circle cx="100" cy="86" r="62" className="art-plate" />
        <circle cx="100" cy="86" r="46" className="art-plate-in" />
        <circle cx="84" cy="80" r="16" className="art-main" />
        <circle cx="116" cy="94" r="13" className="art-sub" />
        <path d="M108 62c10-14 30-16 38-12-4 12-20 22-38 12Z" className="art-leaf" />
        <path d="M108 62c10-6 20-9 30-10" className="art-stroke" />
        <circle cx="96" cy="104" r="6" className="art-dot" />
      </svg>
    )
  }
  if (tone === 'amber') {
    // 칸이 나뉜 식판
    return (
      <svg className="page-hero__art" viewBox="0 0 200 160" aria-hidden="true">
        <ellipse cx="100" cy="138" rx="80" ry="10" className="art-shadow" />
        <rect x="24" y="30" width="152" height="100" rx="18" className="art-plate" />
        <rect x="36" y="42" width="38" height="34" rx="9" className="art-sub" />
        <rect x="81" y="42" width="38" height="34" rx="9" className="art-leaf" />
        <rect x="126" y="42" width="38" height="34" rx="9" className="art-dot" />
        <rect x="36" y="84" width="60" height="36" rx="10" className="art-plate-in" />
        <rect x="104" y="84" width="60" height="36" rx="10" className="art-main" />
      </svg>
    )
  }
  // 김이 오르는 국그릇과 말풍선
  return (
    <svg className="page-hero__art" viewBox="0 0 200 160" aria-hidden="true">
      <ellipse cx="96" cy="140" rx="70" ry="10" className="art-shadow" />
      <path d="M34 84h124c0 34-28 50-62 50S34 118 34 84Z" className="art-main" />
      <rect x="28" y="78" width="136" height="12" rx="6" className="art-sub" />
      <path d="M78 66c-8-10 8-16 0-28M98 66c-8-10 8-16 0-28M118 66c-8-10 8-16 0-28" className="art-stroke" />
      <path d="M140 18h40a12 12 0 0 1 12 12v18a12 12 0 0 1-12 12h-22l-12 10v-10h-6a12 12 0 0 1-12-12V30a12 12 0 0 1 12-12Z" className="art-plate" />
      <circle cx="148" cy="39" r="4" className="art-dot" />
      <circle cx="160" cy="39" r="4" className="art-dot" />
      <circle cx="172" cy="39" r="4" className="art-dot" />
    </svg>
  )
}
