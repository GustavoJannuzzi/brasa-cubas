import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'
import { IconCube, IconNotebook, IconPhone, IconPhotos, IconShelf } from '../ui/Icons'
import { vidro } from '../ui/vidro'

// Variante B1 da barra de baixo do celular (?barra=b1).
//
// O que muda em relacao a de hoje, e por que:
//
// - MAIS ALTA: 48 px de alvo de toque contra 30, barra de ~67 px contra 46,5.
//   O alvo de hoje passa no AA (24 px) e falha no AAA (44); este passa nos dois.
// - COM ICONE: e o que faz a barra ler como navegacao. O contraste do rotulo de
//   hoje ja e 6,8:1 — o problema medido nao era cor, era "nao parece que da
//   para tocar". Por isso a cor da marca nao muda aqui: cor nova seria decisao
//   dele, e nao e preciso para resolver o defeito.
// - ATIVO MAIS FORTE: o icone da aba atual vai dentro de uma pilula na cor da
//   marca. Como a brasa aqui e OBJETO (fundo de icone), 3:1 basta — nao e texto.
// - PUBLICA A PROPRIA ALTURA em --barra-altura: o card de destaque, a barra da
//   peca, a barra do tour e os avisos ficam ancorados em calc(4.4rem + sobra),
//   e so sobra 24,65 px antes de a barra encostar neles. Com a variavel, eles
//   sobem junto; sem parametro a variavel nao existe e o calc da o valor de
//   hoje. E o mesmo molde do --ancora-baixo que o Overlays ja usa.
//
// Estilo inline, sem classe do Tailwind: o Tailwind v4 varre o projeto inteiro
// e escreve um CSS unico, entao classe usada so aqui vazaria para o site
// publicado. As duas classes usadas (camada-cena, area-segura-b) sao utilitarios
// que ja existem no CSS por causa da barra de hoje.

const ITENS = [
  { id: 'home', label: 'Ateliê', Icone: IconCube },
  { id: 'produtos', label: 'Produtos', Icone: IconShelf },
  { id: 'orcamento', label: 'Orçamento', Icone: IconNotebook },
  { id: 'galeria', label: 'Projetos', Icone: IconPhotos },
  { id: 'contato', label: 'Contato', Icone: IconPhone },
]

export function BarraB1() {
  const panel = useStore((s) => s.panel)
  const openPanel = useStore((s) => s.openPanel)
  const goTo = useStore((s) => s.goTo)
  const closePanel = useStore((s) => s.closePanel)
  const view = useStore((s) => s.view)
  const barra = useRef(null)

  // A altura real vai para o CSS. ResizeObserver, e nao um numero digitado,
  // porque a barra cresce com a area segura do aparelho e com o zoom de pagina.
  //
  // Duas correcoes na conta, as duas medidas:
  // 1. RESPIRO: o que fica ancorado acima da barra usa calc(4.4rem + sobra), e
  //    4.4rem sao os 46,5 px da barra de hoje MAIS 24 px de vao. Publicando so
  //    a altura, o cartao encostava na barra (folga 0 medida).
  // 2. BASE_SEGURA: a formula do CSS ja soma --sobra-area-segura, que e quanto
  //    a area segura do iPhone passa de 0,75rem. Como offsetHeight ja inclui
  //    esse padding, publicar a altura crua contaria a area segura DUAS vezes
  //    no aparelho do dono. Normalizando o padding de baixo para o piso de
  //    0,75rem, a soma do CSS volta a ficar certa nos dois casos.
  useEffect(() => {
    const el = barra.current
    if (!el) return
    const BASE_SEGURA = 12
    const RESPIRO = 24
    const publicar = () => {
      const padB = parseFloat(getComputedStyle(el).paddingBottom) || 0
      const ancora = el.offsetHeight - padB + BASE_SEGURA + RESPIRO
      document.documentElement.style.setProperty('--barra-altura', `${ancora}px`)
    }
    publicar()
    const ro = new ResizeObserver(publicar)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--barra-altura')
    }
  }, [])

  return (
    <nav
      ref={barra}
      className="camada-cena area-segura-b"
      aria-label="Seções do site"
      style={{
        position: 'fixed',
        insetInline: 0,
        bottom: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        paddingInline: 4,
        paddingTop: 6,
        borderTop: '1px solid rgba(247,241,232,0.12)',
        background: 'rgba(43,35,32,0.92)',
        ...vidro(8),
      }}
    >
      {ITENS.map(({ id, label, Icone }) => {
        const ativo = id === 'home' ? !panel && view === 'home' : panel === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              if (id === 'home') {
                closePanel()
                goTo('home')
              } else {
                openPanel(id)
              }
            }}
            aria-current={ativo ? 'page' : undefined}
            style={{
              flex: 1,
              minHeight: 48,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              padding: '4px 2px',
              border: 0,
              borderRadius: 12,
              background: 'transparent',
              color: ativo ? '#f7f1e8' : 'rgba(247,241,232,0.72)',
              font: '500 11px/1.2 ui-sans-serif, system-ui',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 30,
                height: 24,
                borderRadius: 999,
                background: ativo ? '#c2582d' : 'transparent',
                color: ativo ? '#f7f1e8' : 'inherit',
              }}
            >
              <Icone size={18} />
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
