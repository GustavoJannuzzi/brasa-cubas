import { useMemo, useState } from 'react'
import { categories, gallery, products } from '../data/products'
import { faq, howToOrder, studio } from '../data/studio'
import { money, plural, priceLabel } from '../lib/format'
import { cartMessage, plainHello } from '../lib/whatsapp'
import { useCartSummary, useStore } from '../store/useStore'
import { IconArrow, IconCube, IconInstagram, IconMail, IconPlus, IconWhatsapp } from './Icons'
import { PieceThumb } from './PieceThumb'

const SECOES = [
  ['#produtos', 'Produtos'],
  ['#encomendar', 'Como encomendar'],
  ['#contato', 'Contato'],
]

// Mesma informacao do ateliê 3D, em uma pagina que rola.
// Existe para conexao fraca, aparelho antigo, leitor de tela e para quem
// simplesmente quer ver a lista de precos e ir embora.
export function SimpleMode() {
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const addToCart = useStore((s) => s.addToCart)
  const openPanel = useStore((s) => s.openPanel)
  const { lines, count, total, isEstimate } = useCartSummary()
  const [filter, setFilter] = useState('todos')

  const lista = useMemo(
    () => (filter === 'todos' ? products : products.filter((p) => p.category === filter)),
    [filter],
  )

  return (
    <div className="min-h-svh bg-porcelana pb-28">
      <header className="sticky top-0 z-20 border-b border-carvao/10 bg-porcelana/95" style={{ backdropFilter: 'blur(8px)' }}>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brasa text-porcelana">
            <span className="font-display text-[15px] leading-none">bc</span>
          </span>
          {/* min-w-0 + truncate: sem isso o nome quebrava em duas linhas em
              tela de 375px e empurrava os botoes para fora. */}
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[17px] text-carvao">{studio.name}</span>
            <span className="block truncate text-[11px] text-carvao/55">{studio.tagline}</span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Seções da página">
              {SECOES.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-full px-3 py-2 text-[12.5px] font-medium text-carvao/65 hover:bg-carvao/6 hover:text-carvao"
                >
                  {label}
                </a>
              ))}
            </nav>

            {count > 0 && (
              <button
                type="button"
                onClick={() => openPanel('carrinho')}
                className="btn-secundario px-3.5 py-2 text-[12.5px] whitespace-nowrap"
              >
                Pedido ({count})
              </button>
            )}

            {/* Com o "Pedido (n)" ao lado nao cabem dois botoes escritos em
                375px. Aqui a lista e o que a pessoa escolheu: o 3D fica em
                icone, com nome para leitor de tela. */}
            <button
              type="button"
              onClick={toggleSimpleMode}
              aria-label="Ver o ateliê em 3D"
              className="btn-secundario px-3 py-2 text-[12.5px] whitespace-nowrap sm:px-3.5"
            >
              <IconCube size={15} />
              <span className="hidden sm:inline">Ver o ateliê em 3D</span>
            </button>
          </div>
        </div>

        {/* No celular os links de secao sumiam (hidden sm:flex): chegar ao
            contato exigia rolar a pagina inteira. Faixa rolavel, que cabe em
            tela estreita sem empurrar o resto do cabecalho. */}
        <nav
          className="rolagem-fina flex gap-1.5 overflow-x-auto border-t border-carvao/10 px-4 py-2 sm:hidden"
          aria-label="Seções da página"
        >
          {SECOES.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-full border border-carvao/12 bg-creme px-3 py-1.5 text-[12.5px] font-medium text-carvao/70"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 [&_section]:scroll-mt-20">
        <section className="py-8">
          <h1 className="font-display text-[30px] leading-tight text-carvao sm:text-[36px]">
            Peças de porcelana fria, modeladas à mão sob encomenda
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-carvao/70">
            {studio.pitch} Topos de bolo, arranjos de flores, lembrancinhas de festa e peças
            decorativas. {studio.city} · {studio.shipping}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="#produtos" className="btn-principal">
              Ver os produtos
              <IconArrow size={16} />
            </a>
            <button type="button" onClick={() => openPanel('orcamento')} className="btn-secundario">
              Pedir orçamento
            </button>
          </div>
        </section>

        <section id="produtos" className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Produtos</h2>
          <p className="mt-1 text-[13.5px] text-carvao/60">
            {products.length} peças. Valores de tabela; personalização sai por orçamento.
          </p>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                aria-pressed={filter === cat.id}
                className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium ${
                  filter === cat.id ? 'border-carvao bg-carvao text-porcelana' : 'border-carvao/15 bg-creme text-carvao/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {lista.map((product) => (
              <li key={product.id} className="cartao flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <PieceThumb piece={product.piece} size={76} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] leading-snug">{product.name}</h3>
                    <p className="mt-1 text-[15px] font-semibold text-brasa">{priceLabel(product)}</p>
                    <p className="text-[11.5px] text-carvao/50">
                      {product.sizeCm} · {product.leadDays} dias
                      {product.minQty > 1 && ` · mín. ${product.minQty}`}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 flex-1 text-[13px] leading-relaxed text-carvao/70">{product.description}</p>
                <button
                  type="button"
                  onClick={() => addToCart(product.id)}
                  className="btn-secundario mt-3 w-full py-2.5 text-[13px]"
                >
                  <IconPlus size={15} />
                  Adicionar ao pedido
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section id="encomendar" className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Como encomendar</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {howToOrder.map((item) => (
              <li key={item.step} className="cartao flex gap-3 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brasa/12 font-display font-semibold text-brasa">
                  {item.step}
                </span>
                <span>
                  <span className="block text-[14px] font-medium text-carvao">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-carvao/68">{item.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <button type="button" onClick={() => openPanel('orcamento')} className="btn-principal mt-4">
            Começar meu orçamento
            <IconArrow size={16} />
          </button>
        </section>

        <section className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Projetos entregues</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {gallery.map((item) => (
              <li key={item.id} className="cartao overflow-hidden">
                <div
                  className="h-24"
                  style={{ background: `linear-gradient(135deg, ${item.palette[0]}, ${item.palette[1]})` }}
                />
                <div className="p-3.5">
                  <h3 className="text-[14.5px]">{item.title}</h3>
                  <p className="mt-0.5 text-[12px] font-medium text-brasa">
                    {item.kind} · {item.year}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-carvao/70">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Dúvidas frequentes</h2>
          <dl className="mt-4 grid gap-3">
            {faq.map((item) => (
              <div key={item.q} className="cartao p-4">
                <dt className="text-[14px] font-medium text-carvao">{item.q}</dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-carvao/70">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="contato" className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Falar com o ateliê</h2>
          <p className="mt-1 text-[13.5px] text-carvao/60">
            {studio.hours} · {studio.answerTime}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <a href={plainHello()} target="_blank" rel="noreferrer" className="btn-principal">
              <IconWhatsapp size={17} />
              {studio.whatsappLabel}
            </a>
            <a href={`mailto:${studio.email}`} className="btn-secundario">
              <IconMail size={17} />
              E-mail
            </a>
            <a href={studio.instagramUrl} target="_blank" rel="noreferrer" className="btn-secundario">
              <IconInstagram size={17} />
              {studio.instagram}
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-carvao/10 py-6 text-center text-[12px] text-carvao/50">
        {studio.name} · {studio.city} · {studio.email}
      </footer>

      {lines.length > 0 && (
        <div className="area-segura-b fixed inset-x-0 bottom-0 z-30 border-t border-carvao/10 bg-creme px-4 pt-3">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            {/* Isto era so um rotulo, e o unico caminho daqui era o WhatsApp.
                Quem tocou "Adicionar" duas vezes numa lembrancinha (40 un,
                R$ 480) so corrigia voltando ao 3D — justamente o que pesava,
                e o motivo de estar no modo simples. Agora abre o pedido, que
                da para revisar, mudar quantidade e remover. */}
            <button
              type="button"
              onClick={() => openPanel('carrinho')}
              className="btn-secundario min-w-0 flex-1 justify-start px-3.5 py-2 text-left"
            >
              <span className="min-w-0">
                {/* "estimativa" na linha do rotulo: junto do valor, jogava o
                    numero para uma terceira linha em 375px. */}
                <span className="block text-[12px] font-normal text-carvao/55">
                  Ver pedido · {plural(count, 'peça', 'peças')}
                  {isEstimate && ' · estimativa'}
                </span>
                <span className="block text-[16px] font-semibold text-carvao">{money(total)}</span>
              </span>
            </button>
            <a
              href={cartMessage(lines, total, isEstimate)}
              target="_blank"
              rel="noreferrer"
              className="btn-principal shrink-0"
            >
              <IconWhatsapp size={17} />
              Fechar pedido
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
