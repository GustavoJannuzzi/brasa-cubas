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
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5 text-left" aria-label="Voltar para a visão geral do ateliê">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brasa text-porcelana">
        <span className="font-display text-[15px] leading-none">bc</span>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] text-porcelana">{studio.name}</span>
        <span className="block text-[11px] text-porcelana/60">{studio.tagline}</span>
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
    <header className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 px-3 py-2.5 md:px-5 md:py-3">
      {/* fundo em degradê para o menu ler sobre a cena sem virar uma barra opaca */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'linear-gradient(to bottom, rgb(28 21 18 / 0.78), transparent)' }}
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
                : 'text-porcelana/80 hover:bg-porcelana/12 hover:text-porcelana'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1 md:ml-2">
        <button
          type="button"
          onClick={() => openPanel('carrinho')}
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
            panel === 'carrinho' ? 'bg-porcelana text-carvao' : 'text-porcelana/85 hover:bg-porcelana/12'
          }`}
          aria-label={`Pedido: ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
        >
          <IconCart size={19} />
          <span className="hidden sm:inline">Pedido</span>
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
          className="hidden rounded-full p-2 text-porcelana/70 transition-colors hover:bg-porcelana/12 hover:text-porcelana md:block"
        >
          <IconLayers size={19} />
        </button>

        <button
          type="button"
          onClick={() => openPanel('ajuda')}
          title="Como navegar"
          aria-label="Como navegar"
          className="rounded-full p-2 text-porcelana/70 transition-colors hover:bg-porcelana/12 hover:text-porcelana"
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
      className="area-segura-b fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-porcelana/10 bg-carvao/92 px-1 pt-1 md:hidden"
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
