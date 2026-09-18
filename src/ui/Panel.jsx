import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsMobile } from '../hooks/useMedia'
import { useStore } from '../store/useStore'
import { IconBack, IconClose } from './Icons'
import { vidro } from './vidro'

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

// O que conta como focavel: a MESMA lista para prender o Tab dentro da folha e
// para achar um lugar de reserva quando quem abriu o painel nao existe mais.
// Duas listas escritas por extenso acabariam divergindo.
const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Contêiner dos conteudos do site.
 * No desktop e uma gaveta a direita, que deixa a cena visivel ao lado.
 * No celular e uma folha de baixo, arrastavel para fechar — o gesto que
 * a pessoa espera de um app.
 */
export function Panel({ title, subtitle, onClose, onBack, children, footer }) {
  const isMobile = useIsMobile()
  const dispensarPainel = useStore((s) => s.dispensarPainel)
  // Fechar o cartao e voltar para a visao geral sao a MESMA acao, e ela mora
  // aqui — no unico lugar por onde passam o X, o toque fora, o arrasto para
  // baixo e o Esc. Nos sete paineis, `onClose` e sempre `closePanel`; ele
  // continua sendo chamado para nao mudar o contrato de quem usa o Panel.
  const fechar = useCallback(() => {
    dispensarPainel()
    onClose()
  }, [dispensarPainel, onClose])
  const sheet = useRef(null)
  const [drag, setDrag] = useState(0)
  const dragAtual = useRef(0)
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
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fechar])

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
        // So devolve se o foco se PERDEU (foi para o body junto com o painel).
        // Se ele ja esta em outro lugar, alguem assumiu de proposito: outro
        // painel, ou a barra do tour que "Fazer o tour guiado" abre ao fechar a
        // Ajuda — medido, a devolucao roubava o foco dela e o tour comecava com
        // o teclado de volta no cabecalho.
        const ativo = document.activeElement
        if (ativo && ativo !== document.body && document.contains(ativo)) return
        if (alvo && document.contains(alvo) && !alvo.closest('[inert]')) {
          alvo.focus({ preventScroll: true })
          return
        }
        // Quem abriu NAO existe mais. Medido: o botao "Ver produtos" do card de
        // destaque abre Produtos, a camera vai para a estante e o card sai da
        // tela — ao fechar com Esc nao havia para onde devolver, e o foco caia
        // no body. A producao fazia igual antes do conserto do card: o defeito e
        // antigo (o card ja se desmontava com painel aberto). Sem quem abriu, o
        // foco vai para o primeiro elemento focavel fora de dialogo que ACEITAR.
        // Medido: cai no marcador "Orcamento" da cena, que vem antes do cabecalho
        // no DOM. O destino e a ordem do DOM, nao uma escolha — mas o foco nao se
        // perde, e cai num elemento da vista em que a pessoa esta.
        const candidatos = [...document.querySelectorAll(FOCAVEIS)].filter(
          (el) =>
            !el.closest('[role="dialog"]') &&
            !el.closest('[inert]') &&
            !el.closest('[aria-hidden="true"]') &&
            el.getClientRects().length > 0,
        )
        // Tenta ate um aceitar DE VERDADE. Elemento com `visibility: hidden` tem
        // caixa (passa no filtro acima) mas recusa o foco em silencio; parar no
        // primeiro deixaria o foco no body sem aviso nenhum — que e exatamente o
        // defeito que este bloco existe para consertar.
        for (const el of candidatos) {
          el.focus({ preventScroll: true })
          if (document.activeElement === el) break
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
      const focaveis = sheet.current?.querySelectorAll(FOCAVEIS)
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

  // Altura da folha do celular em --folha-altura, para os avisos subirem acima
  // dela (Toasts, em Overlays). Medido: adicionando pelo detalhe da peca, o aviso
  // nascia sobre o seletor de quantidade e o "1" sumia por 2,6 s.
  // offsetHeight e nao getBoundingClientRect: a folha entra com transform.
  useEffect(() => {
    const el = sheet.current
    if (!isMobile || !el) return
    const raiz = document.documentElement
    const observador = new ResizeObserver(() => raiz.style.setProperty('--folha-altura', `${el.offsetHeight}px`))
    observador.observe(el)
    return () => {
      observador.disconnect()
      raiz.style.removeProperty('--folha-altura')
    }
  }, [isMobile])

  const onPointerDown = useCallback((e) => {
    if (!e.isPrimary) return
    gesture.current = { startY: e.clientY, id: e.pointerId }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!gesture.current) return
    const d = Math.max(0, e.clientY - gesture.current.startY)
    dragAtual.current = d
    setDrag(d)
  }, [])

  // O quanto arrastou vem de uma ref, e o onClose fica FORA do atualizador de
  // estado: chamado la dentro (que o StrictMode ainda roda duas vezes), ele
  // atualizava outro componente durante a renderizacao — erro no console a cada
  // folha fechada arrastando (medido).
  const onPointerUp = useCallback(() => {
    if (!gesture.current) return
    gesture.current = null
    const d = dragAtual.current
    dragAtual.current = 0
    setDrag(0)
    if (d > 110) fechar()
  }, [fechar])

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
          onClick={fechar}
          className="camada-cena fixed inset-0 z-30 bg-carvao/35"
          style={vidro(1)}
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
            : 'anim-gaveta fixed top-[4.75rem] right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex w-[27rem] flex-col overflow-hidden rounded-2xl bg-porcelana outline-none'
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
          {/* Voltar e Fechar em 44x44, o minimo de alvo de toque (o seletor de
              quantidade do carrinho ja tinha ido para 44 no MI-08); estavam em
              42x34, em TODOS os paineis. A caixa cresce de verdade, e nao so a
              area de toque por pseudo-elemento, porque a sonda mede com
              getBoundingClientRect, que nao enxerga pseudo-elemento: ela seguiria
              dizendo 42x34 com o toque ja em 44. O -my-1.5 devolve a altura que a
              caixa ganhou, para o cabecalho nao crescer. */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Voltar"
              className="btn-fantasma -my-1.5 -ml-1 h-11 w-11 shrink-0 p-0"
            >
              <IconBack size={18} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            {/* Quebra em vez de cortar: no detalhe da peca o titulo e o nome, e ele
                nao aparece em outro lugar do painel. Com `truncate`, em 375 se lia
                "Lembrancinha Vasinho de Fl…" (243 de 261 px). */}
            <h2 className="text-lg text-balance md:text-xl">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] leading-snug text-carvao/70">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="btn-fantasma -my-1.5 h-11 w-11 shrink-0 p-0"
          >
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
