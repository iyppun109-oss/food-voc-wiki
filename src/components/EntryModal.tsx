import { useEffect, useRef } from 'react'
import type { VocCase } from '../data/vocCases'

interface EntryModalProps {
  entry: VocCase
  onClose: () => void
}

const SECTIONS: { key: keyof VocCase; label: string }[] = [
  { key: 'incident', label: '사고 내용' },
  { key: 'customerScript', label: '고객 응대 문구' },
  { key: 'onsiteAction', label: '현장 조치' },
  { key: 'rootCause', label: '원인 분석' },
  { key: 'prevention', label: '재발방지 대책' },
  { key: 'reportExample', label: '보고서 예시' },
]

export function EntryModal({ entry, onClose }: EntryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal__header">
          <div>
            <span className="modal__category">{entry.category}</span>
            <h2 id="modal-title" className="modal__title">
              {entry.title}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <div className="modal__body">
          {SECTIONS.map(({ key, label }) => (
            <section key={key} className="modal__section">
              <h3>{label}</h3>
              <p className={key === 'customerScript' ? 'modal__script' : undefined}>
                {entry[key]}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}