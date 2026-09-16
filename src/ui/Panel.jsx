import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsMobile } from '../hooks/useMedia'
import { IconBack, IconClose } from './Icons'

// O id do rAF de devolucao de foco vive no MODULO, nao na instancia.
//
// Trocar de painel troca de INSTANCIA — PainelAtivo renderiza PANELS[panel], e
// tipos diferentes na mesma posicao desmontam e montam. O React roda todos os
// cleanups antes de todos os efeitos novos, entao com o id guardado num
// useRef o painel que entrava cancelava um id zero (ref recem-criado), e o rAF
// do painel que SAIU disparava um quadro depois e levava o foco para o botao
// do cabecalho — atras da gaveta recem-aberta. Quem usa teclado abria o
// orcamento e o Tab seguinte continuava pelo menu, nao pelos campos.
let devolucaoPendente = 0

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
  // Quem tinha o foco antes de o painel abrir.
  //
  // Capturado na RENDERIZACAO, nao num efeito. Efeito de filho roda antes do
  // efeito do pai, e o `Progresso` do orcamento foca um titulo `sr-only` ao
  // montar: quando a captura rodava como efeito, o foco ja estava dentro da
  // folha, a guarda de "nao guardar o proprio painel" rejeitava (certo), e
  // sobrava NADA para devolver — ao fechar com Esc o foco caia no body. Medido:
  // dos sete paineis, so o orcamento perdia o foco assim, nas duas larguras.
  // A renderizacao do pai acontece antes de qualquer filho montar, entao aqui
  // `document.activeElement` ainda e quem abriu.
  const [quemAbriu] = useState(() => {
    const candidato = document.activeElement
    if (!(candidato instanceof HTMLElement) || candidato === document.body) return null
    // Numa remontagem o foco ja esta dentro de um painel; guardar isso
    // perderia o botao de origem.
    if (candidato.closest('[role="dialog"]')) return null
    return candidato
  })

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // ATENCAO a ordem: este efeito precisa vir ANTES do que move o foco para o
  // painel. Efeitos rodam na ordem em que sao declarados, e invertido ele
  // guardava o proprio painel como "quem abriu" — o foco acabava no body.
  useEffect(() => {
    // Devolve ao fechar o foco de quem abriu. Sem isto, cada painel fechado
    // jogava o teclado de volta ao comeco da pagina, e quem navega assim
    // perdia o lugar a cada ida e volta.
    // Cancela uma devolucao agendada por um cleanup anterior — do StrictMode
    // OU de outro painel. Ver o comentario de `devolucaoPendente`.
    cancelAnimationFrame(devolucaoPendente)

    return () => {
      const alvo = quemAbriu
      // Depois do commit, e nao dentro dele: no celular o fundo fica inerte
      // enquanto a folha existe, e o React remove o painel antes de tirar o
      // inert do irmao. Focar ali dentro era engolido, e o foco caia no body.
      devolucaoPendente = requestAnimationFrame(() => {
        // Se a essa altura o foco ja esta dentro de um dialogo, outro painel
        // assumiu: devolver agora seria roubar dele.
        if (document.activeElement?.closest?.('[role="dialog"]')) return
        if (alvo && document.contains(alvo) && !alvo.closest('[inert]')) {
          alvo.focus({ preventScroll: true })
        }
      })
    }
  }, [])

  useEffect(() => {
    // Leva o foco para o painel, para leitor de tela e teclado acompanharem.
    sheet.current?.focus({ preventScroll: true })
  }, [title])

  useEffect(() => {
    // No celular a folha e modal: o Tab tem de circular dentro dela.
    if (!isMobile) return
    const onKey = (e) => {
      if (e.key !== 'Tab') return
      const focaveis = sheet.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focaveis?.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile])

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
        // Fundo de tocar-para-fechar. Fora da ordem de tabulacao e escondido do
        // leitor de tela DE PROPOSITO: medido, ele era um `button` tabulavel de
        // 375x812 — a tela inteira — invisivel, e o leitor anunciava "Fechar"
        // cobrindo tudo. O caminho de teclado ja existe e foi medido: Esc fecha
        // os sete paineis. O toque continua igual.
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          onClick={onClose}
          className="camada-cena fixed inset-0 z-30 bg-carvao/35"
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
          touchAction: 'pan-y',
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
            {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-carvao/70">{subtitle}</p>}
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
