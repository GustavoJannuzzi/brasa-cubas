import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsMobile } from '../hooks/useMedia'
import { IconBack, IconClose } from './Icons'

/**
 * Contêiner dos conteudos do site.
 * No desktop e uma gaveta a direita, que deixa a cena visivel ao lado.
 * No celular e uma folha de baixo, arrastavel para fechar — o gesto que
 * a pessoa espera de um app.
 */
export function Panel({ title, subtitle, onClose, onBack, children, footer }) {
  const isMobile = useIsMobile()
  const sheet = useRef(null)
  const [drag, setDrag] = useState(0)
  const gesture = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    // Leva o foco para o painel, para leitor de tela e teclado acompanharem.
    sheet.current?.focus({ preventScroll: true })
  }, [title])

  const onPointerDown = useCallback((e) => {
    if (!e.isPrimary) return
    gesture.current = { startY: e.clientY, id: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!gesture.current) return
    setDrag(Math.max(0, e.clientY - gesture.current.startY))
  }, [])

  const onPointerUp = useCallback(() => {
    if (!gesture.current) return
    gesture.current = null
    setDrag((d) => {
      if (d > 110) onClose()
      return 0
    })
  }, [onClose])

  return (
    <>
      {isMobile && (
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-carvao/35"
          style={{ backdropFilter: 'blur(1px)' }}
        />
      )}

      <section
        ref={sheet}
        tabIndex={-1}
        role="dialog"
        aria-modal={isMobile ? 'true' : 'false'}
        aria-label={title}
        className={
          isMobile
            ? 'anim-painel fixed inset-x-0 bottom-0 z-40 flex max-h-[84svh] flex-col rounded-t-3xl bg-porcelana outline-none'
            : 'anim-gaveta fixed top-[4.75rem] right-4 bottom-4 z-40 flex w-[27rem] flex-col overflow-hidden rounded-2xl bg-porcelana outline-none'
        }
        style={{
          boxShadow: 'var(--shadow-painel)',
          transform: drag ? `translateY(${drag}px)` : undefined,
          transition: gesture.current ? 'none' : 'transform 0.25s var(--ease-suave)',
        }}
      >
        {isMobile && (
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1"
          >
            <span className="h-1.5 w-11 rounded-full bg-carvao/20" />
          </div>
        )}

        <header className="flex shrink-0 items-start gap-2 border-b border-carvao/10 px-4 py-3 md:px-5 md:py-4">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Voltar" className="btn-fantasma -ml-1 shrink-0">
              <IconBack size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg md:text-xl">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-carvao/60">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="btn-fantasma shrink-0">
            <IconClose size={18} />
          </button>
        </header>

        <div className="rolagem-fina min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-5">
          {children}
        </div>

        {footer && (
          <footer className="area-segura-b shrink-0 border-t border-carvao/10 bg-creme px-4 pt-3 md:px-5 md:pb-4">
            {footer}
          </footer>
        )}
      </section>
    </>
  )
}
