import { useEffect, useRef } from 'react'
import { studio } from '../data/studio'
import { selectCartCount, useStore } from '../store/useStore'
import { IconCart, IconCube, IconHelp, IconLayers, IconNotebook, IconPhone, IconPhotos, IconShelf } from './Icons'
import { vidro } from './vidro'

// O menu e o principal remedio contra "nao achei onde compra":
// esta sempre visivel e leva direto ao conteudo, sem exigir exploracao.
export const NAV = [
  { id: 'produtos', label: 'Produtos' },
  { id: 'galeria', label: 'Projetos' },
  { id: 'processo', label: 'Como encomendar' },
  { id: 'orcamento', label: 'Orçamento' },
  { id: 'contato', label: 'Contato' },
]

function Marca({ onClick }) {
  // O nome acessivel COMECA pelo texto que esta na tela (WCAG 2.5.3, nivel A).
  // Antes era so "Voltar para a visao geral do atelie": quem usa comando de voz e
  // diz "clicar em Brasa Cubas" nao acionava o botao, porque para o leitor ele nao
  // se chamava assim. Medido numa auditoria de todo focavel com rotulo e texto
  // visivel: era a UNICA falha (os marcadores e o "Pedido" ja passavam).
  // Montado dos mesmos dados que desenham o texto — escrito a mao, divergiria em
  // silencio no dia em que o nome mudasse em studio.js.
  // Area de toque de 44 (media 36); o -my-1 devolve a altura ganha, e o cabecalho
  // nao cresce.
  // Entre 768 e 960 (iPad em pe, iPhone deitado) fica so o monograma: o menu de
  // desktop ja aparece e a linha inteira precisa de 926 px (folga de 34 para fonte
  // que renderiza mais larga ou ainda nao carregou). Medido: em 768/812/820
  // o nome ia a 2 linhas e o subtitulo a 3, o cabecalho a 100 px e o texto descia
  // 20,6 px por cima do chip "Visao geral do atelie"; "Como encomendar" em 2
  // linhas. So monograma + carrinho so de icone precisa de 748. O nome segue no
  // aria-label.
  return (
    <button
      type="button"
      onClick={onClick}
      className="-my-1 flex min-h-11 items-center gap-2.5 text-left"
      aria-label={`${studio.name}, ${studio.tagline}: voltar para a visão geral`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brasa text-porcelana">
        <span className="font-display text-[15px] leading-none">bc</span>
      </span>
      <span className="leading-tight md:hidden min-[60rem]:block">
        {/* translate="no": nome proprio. Com a pagina traduzida pelo navegador,
            "Brasa" e palavra comum e pode ser traduzida. So o nome; o subtitulo
            traduz. Mesmo cuidado no carregador, na lista e no titulo do atelie. */}
        <span translate="no" className="block font-display text-[17px] text-porcelana">
          {studio.name}
        </span>
        {/* Abaixo de 18rem (zoom de pagina do Android: 390 px a 150% sao 260) o
            subtitulo quebrava, a marca ia a 5 linhas e as letras desciam 178 px2
            sobre o chip de posicao e 676 sobre o botao de lista. Ele segue no
            aria-label. */}
        <span className="block text-[11px] text-porcelana/80 max-[18rem]:hidden">{studio.tagline}</span>
      </span>
    </button>
  )
}

export function Header() {
  const panel = useStore((s) => s.panel)
  const openPanel = useStore((s) => s.openPanel)
  const goTo = useStore((s) => s.goTo)
  const closePanel = useStore((s) => s.closePanel)
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const cartCount = useStore(selectCartCount)

  const home = () => {
    closePanel()
    goTo('home')
  }

  return (
    <header className="camada-cena fixed inset-x-0 top-0 z-30 flex items-center gap-3 py-2.5 pr-[max(0.75rem,env(safe-area-inset-right))] pl-[max(0.75rem,env(safe-area-inset-left))] md:py-3 md:pr-[max(1.25rem,env(safe-area-inset-right))] md:pl-[max(1.25rem,env(safe-area-inset-left))]">
      {/* fundo em degradê para o menu ler sobre a cena sem virar uma barra opaca */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        // O degrade some rapido demais: na linha do texto o alfa caia para
        // ~0,39 e o menu ficava em 3,87:1 sobre a cena clara. Segurar 0,58 ate
        // depois do texto leva para 5,14:1 sem virar barra opaca.
        style={{
          background:
            'linear-gradient(to bottom, rgb(28 21 18 / 0.82) 0%, rgb(28 21 18 / 0.58) 64%, transparent 100%)',
        }}
      />

      <Marca onClick={home} />

      <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Seções do site">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openPanel(item.id)}
            aria-current={panel === item.id ? 'page' : undefined}
            // px-3 ate 960: com pecas no pedido o selo soma 27-32 px, e em 768
            // "Como encomendar" voltava a quebrar (cabecalho a 79). Medido.
            className={`rounded-full px-3 py-2 text-[13px] font-medium transition-colors min-[60rem]:px-3.5 ${
              panel === item.id
                ? 'bg-porcelana text-carvao'
                : // Porcelana cheia: a /80 sobre o degrade dava 3,24:1 na linha
                  // do texto. Cheia da 5,02:1 sem precisar escurecer mais o
                  // fundo e virar uma barra opaca sobre a cena.
                  'text-porcelana hover:bg-porcelana/12'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Carrinho, camadas e ajuda com area de toque de 44 (mediam 35; o carrinho
          so de icone no celular, 43x35). Sem fundo em repouso, a caixa maior nao
          aparece; o -my-1 devolve a altura e o cabecalho segue igual (medido
          contra a producao: 56 em 375, 60 em 1440).
          O que muda, e pouco: os icones ficam alguns px mais para dentro, porque
          a caixa cresceu com o icone centralizado. Medido em 375: ajuda 4,5 px,
          carrinho 9,5 px. Compensar com margem negativa faria as areas de toque
          da ajuda e das camadas se sobreporem no vao de 4 px entre elas. */}
      <div className="ml-auto flex items-center gap-1 md:ml-2">
        <button
          type="button"
          onClick={() => openPanel('carrinho')}
          className={`relative -my-1 flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
            panel === 'carrinho' ? 'bg-porcelana text-carvao' : 'text-porcelana hover:bg-porcelana/12'
          }`}
          // Mesma palavra e mesma conta do selo, do subtitulo do painel e da
          // barra do modo lista: unidades, nao linhas.
          aria-label={`Pedido: ${cartCount} ${cartCount === 1 ? 'peça' : 'peças'}`}
        >
          <IconCart size={19} />
          {/* Some tambem entre 768 e 960, junto com o nome da marca (ver Marca). */}
          <span className="hidden sm:inline md:hidden min-[60rem]:inline">Pedido</span>
          {cartCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brasa px-1 text-[11px] font-semibold text-porcelana">
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={toggleSimpleMode}
          title="Ver como lista, sem 3D"
          aria-label="Ver como lista, sem 3D"
          className="-my-1 hidden h-11 w-11 place-items-center rounded-full text-porcelana/85 transition-colors hover:bg-porcelana/12 hover:text-porcelana md:grid"
        >
          <IconLayers size={19} />
        </button>

        <button
          type="button"
          onClick={() => openPanel('ajuda')}
          title="Como navegar"
          aria-label="Como navegar"
          className="-my-1 grid h-11 w-11 place-items-center rounded-full text-porcelana/85 transition-colors hover:bg-porcelana/12 hover:text-porcelana"
        >
          <IconHelp size={19} />
        </button>
      </div>
    </header>
  )
}

// Barra de baixo no celular.
//
// Mais alta e com icone desde o teste do dono no iPhone: o retorno foi "a barra
// esta baixa e o marrom nao deixa claro que da para navegar por ali". Medido
// antes de mexer, o contraste do rotulo ja era 6,8:1 — o defeito nao era cor,
// era tamanho e cara de botao. Por isso nenhuma cor nova entrou aqui.
//
// | | antes | agora |
// | altura da barra | 46,8 px | 67 px |
// | alvo de toque | 30 px (passa no AA, falha no AAA) | 48 px (passa nos dois) |
// | rotulo inativo | 6,8:1 | 8,0:1 |
// | aba ativa | fundo cinza translucido | pilula na cor da marca (3,6:1, e para
//   objeto o minimo e 3) |
const ITENS = [
  { id: 'home', label: 'Ateliê', Icone: IconCube },
  { id: 'produtos', label: 'Produtos', Icone: IconShelf },
  { id: 'orcamento', label: 'Orçamento', Icone: IconNotebook },
  { id: 'galeria', label: 'Projetos', Icone: IconPhotos },
  { id: 'contato', label: 'Contato', Icone: IconPhone },
]

// Quanto a barra "ocupa" para quem fica ancorado acima dela: a altura dela mais
// o mesmo vao de 24 px que o cartao de destaque sempre teve. E a altura entra
// normalizada no piso de 0,75rem de area segura, porque o CSS desses ancoras ja
// soma --sobra-area-segura: publicar a altura crua contaria a area segura do
// iPhone DUAS vezes.
const BASE_SEGURA = 12
const RESPIRO = 24

export function MobileNav() {
  const panel = useStore((s) => s.panel)
  const openPanel = useStore((s) => s.openPanel)
  const goTo = useStore((s) => s.goTo)
  const closePanel = useStore((s) => s.closePanel)
  const view = useStore((s) => s.view)
  const barra = useRef(null)

  useEffect(() => {
    const el = barra.current
    if (!el) return
    const publicar = () => {
      const padB = parseFloat(getComputedStyle(el).paddingBottom) || 0
      document.documentElement.style.setProperty(
        '--barra-altura',
        `${el.offsetHeight - padB + BASE_SEGURA + RESPIRO}px`,
      )
    }
    publicar()
    // ResizeObserver, e nao um numero digitado: a barra cresce com a area segura
    // do aparelho e com o zoom de pagina do Android.
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
      className="camada-cena area-segura-b fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-0.5 border-t border-porcelana/12 bg-carvao/92 px-1 pt-1.5 md:hidden"
      style={vidro(8)}
      aria-label="Seções do site"
    >
      {ITENS.map(({ id, label, Icone }) => {
        const active = id === 'home' ? !panel && view === 'home' : panel === id
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
            aria-current={active ? 'page' : undefined}
            // Abaixo de 18rem (zoom de pagina do Android: 390 px a 150% sao 260)
            // o recuo sai e a letra vai a 10 px, senao "Orcamento" nao cabe.
            className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-[3px] rounded-xl px-0.5 py-1 text-[11px] leading-tight font-medium transition-colors max-[18rem]:px-0 max-[18rem]:text-[10px] ${
              active ? 'text-porcelana' : 'text-porcelana/72'
            }`}
          >
            <span
              className={`grid h-6 w-[30px] place-items-center rounded-full transition-colors ${
                active ? 'bg-brasa text-porcelana' : ''
              }`}
            >
              <Icone size={18} />
            </span>
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
