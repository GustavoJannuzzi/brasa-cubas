import { studio } from '../data/studio'
import { selectCartCount, useStore } from '../store/useStore'
import { IconCart, IconCube, IconHelp, IconLayers } from './Icons'

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
        <span className="block font-display text-[17px] text-porcelana">{studio.name}</span>
        <span className="block text-[11px] text-porcelana/80">{studio.tagline}</span>
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
    <header className="camada-cena fixed inset-x-0 top-0 z-30 flex items-center gap-3 px-3 py-2.5 md:px-5 md:py-3">
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
            className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
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

// Barra de baixo no celular: alcance de polegar e rotulos escritos,
// em vez de um menu escondido atras de um hamburguer.
export function MobileNav() {
  const panel = useStore((s) => s.panel)
  const openPanel = useStore((s) => s.openPanel)
  const goTo = useStore((s) => s.goTo)
  const closePanel = useStore((s) => s.closePanel)
  const view = useStore((s) => s.view)

  const items = [
    { id: 'home', label: 'Ateliê', icon: IconCube },
    { id: 'produtos', label: 'Produtos', icon: null },
    { id: 'orcamento', label: 'Orçamento', icon: null },
    { id: 'galeria', label: 'Projetos', icon: null },
    { id: 'contato', label: 'Contato', icon: null },
  ]

  return (
    <nav
      className="camada-cena area-segura-b fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-porcelana/10 bg-carvao/92 px-1 pt-1 md:hidden"
      style={{ backdropFilter: 'blur(8px)' }}
      aria-label="Seções do site"
    >
      {items.map((item) => {
        const active = item.id === 'home' ? !panel && view === 'home' : panel === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (item.id === 'home') {
                closePanel()
                goTo('home')
              } else {
                openPanel(item.id)
              }
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 rounded-xl px-1 py-2 text-[11px] leading-tight font-medium transition-colors ${
              active ? 'bg-porcelana/15 text-porcelana' : 'text-porcelana/65'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
