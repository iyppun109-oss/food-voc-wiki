import { useEffect, useRef, type RefObject } from 'react'

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * 모달 공통 동작
 * - 열릴 때 첫 버튼(initialFocus)으로 포커스, 닫힐 때 원래 있던 곳으로 되돌림
 * - Tab·Shift+Tab 포커스를 모달 안에 가둠
 * - 배경 스크롤 잠금, Esc로 닫기(onEscape가 true를 돌려주면 닫지 않음)
 */
export function useModalFocus(
  dialogRef: RefObject<HTMLElement | null>,
  initialFocusRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  onEscape?: () => boolean,
) {
  // 콜백은 매 렌더마다 바뀔 수 있으므로 ref로 들고 있어, 열려 있는 동안 효과가 다시 돌지 않게 합니다.
  const onCloseRef = useRef(onClose)
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onCloseRef.current = onClose
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    initialFocusRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onEscapeRef.current?.()) return
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)].filter(
        (element) => element.offsetParent !== null,
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [dialogRef, initialFocusRef])
}
