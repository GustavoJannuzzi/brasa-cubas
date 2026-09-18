import { useMemo, useState } from 'react'
import { categories, gallery, products } from '../data/products'
import { faq, howToOrder, studio } from '../data/studio'
import { money, plural, priceLabel } from '../lib/format'
import { cartMessage, plainHello } from '../lib/whatsapp'
import { useCartSummary, useStore } from '../store/useStore'
import { IconArrow, IconCube, IconInstagram, IconMail, IconMinus, IconPlus, IconWhatsapp } from './Icons'
import { PieceThumb } from './PieceThumb'
import { vidro } from './vidro'

// Sem '#': estes nomes sao os MESMOS que os hashes de painel (#produtos,
// #contato). Como ancora real, o clique escrevia no endereco sem passar pelo
// popstate — e o voltar do navegador, depois, lia aquele hash como pedido de
// painel e abria um modal por cima da lista. A lista rola, nao navega.
const SECOES = [
  ['produtos', 'Produtos'],
  ['encomendar', 'Como encomendar'],
  ['contato', 'Contato'],
]

const irPara = (id) => document.getElementById(id)?.scrollIntoView({ block: 'start' })

// Mesma informacao do ateliê 3D, em uma pagina que rola.
//
// Ela existe para conexao fraca, aparelho antigo, leitor de tela e para quem
// simplesmente quer ver preco e ir embora — e esse ultimo caso e a maioria do
// publico dela, que chega pelo navegador embutido do Instagram.
//
// A forma veio de medir a versao anterior e de olhar o catalogo do WhatsApp
// Business, que e onde esse publico ja compra:
//
// - GRADE DE DUAS COLUNAS no celular. A versao anterior era uma coluna so ate
//   640 px, ou seja, uma coluna para 100% do publico dela. Medido: o primeiro
//   produto so aparecia depois de 695 px de rolagem, com 38% da primeira tela
//   ocupada por texto e ZERO preco visivel.
// - CARTAO INVERTIDO: a peca em cima, grande, e nome e preco como legenda. Era
//   uma miniatura de 76 px ao lado de um paragrafo.
// - O PEDIDO SE MONTA SEM ABRIR NADA, e a quantidade se ajusta no proprio
//   cartao — o "+" do catalogo do WhatsApp existe por isso. Tocar no cartao
//   abre o detalhe para quem quer ler.
// - O QUE DECIDE FICA JUNTO DO PRECO: prazo e pedido minimo. Minimo escondido e
//   o que gera o pedido errado e a conversa chata depois.
export function SimpleMode() {
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const gl3d = useStore((s) => s.gl3d)
  const addToCart = useStore((s) => s.addToCart)
  const setQty = useStore((s) => s.setQty)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const openPanel = useStore((s) => s.openPanel)
  const openProduct = useStore((s) => s.openProduct)
  const cart = useStore((s) => s.cart)
  const { lines, count, total, isEstimate } = useCartSummary()
  const [filter, setFilter] = useState('todos')

  const lista = useMemo(
    () => (filter === 'todos' ? products : products.filter((p) => p.category === filter)),
    [filter],
  )
  const noPedido = useMemo(() => new Map(cart.map((l) => [l.id, l.qty])), [cart])

  return (
    <div className="min-h-svh bg-porcelana pb-28">
      <header className="sticky top-0 z-20 border-b border-carvao/10 bg-porcelana/95" style={vidro(8)}>
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brasa text-porcelana">
            <span className="font-display text-[15px] leading-none">bc</span>
          </span>
          {/* min-w-0 + truncate: sem isso o nome quebrava em duas linhas em
              tela de 375px e empurrava os botoes para fora. */}
          <span className="min-w-0 leading-tight">
            <span translate="no" className="block truncate font-display text-[17px] text-carvao">
              {studio.name}
            </span>
            <span className="block truncate text-[11px] text-carvao/70">{studio.tagline}</span>
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Seções da página">
              {SECOES.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => irPara(id)}
                  className="rounded-full px-3 py-2 text-[12.5px] font-medium text-carvao/70 hover:bg-carvao/6 hover:text-carvao"
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Com o "Pedido (n)" ao lado nao cabem dois botoes escritos em
                375px. Aqui a lista e o que a pessoa escolheu: o 3D fica em
                icone, com nome para leitor de tela.
                E some de vez quando o aparelho NAO ABRE 3D: convidar para uma
                porta que nao existe so gera um clique frustrado. */}
            {gl3d !== 'indisponivel' && (
              <button
                type="button"
                onClick={toggleSimpleMode}
                aria-label="Ver o ateliê em 3D"
                className="btn-secundario px-3 py-2 text-[12.5px] whitespace-nowrap sm:px-3.5"
              >
                <IconCube size={15} />
                <span className="hidden sm:inline">Ver o ateliê em 3D</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 [&_section]:scroll-mt-20">
        {/* O topo diz o necessario em duas linhas e sai da frente. Antes eram
            um titulo de 30 px, um paragrafo de quatro linhas e dois botoes: o
            catalogo comecava fora da primeira tela. */}
        <section className="pt-6 pb-3">
          <h1 tabIndex={-1} className="font-display text-[23px] leading-tight text-carvao outline-none sm:text-[30px]">
            Peças de porcelana fria, modeladas à mão
          </h1>
          {/* Uma linha, e so. O envio e a entrega em maos ja estao no FAQ e no
              contato; aqui eles empurravam o catalogo para fora da tela. */}
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-carvao/70">
            {studio.city}. Nada é cobrado aqui: você monta o pedido e ele vai pronto para o WhatsApp.
          </p>
        </section>

        <section id="produtos" className="pb-8">
          {/* Os filtros acompanham a rolagem: com 11 pecas em duas colunas, a
              pessoa passa da metade da lista antes de lembrar que da para
              filtrar. `top` casa com a altura do cabecalho. */}
          <div
            className="rolagem-fina sticky top-[3.9rem] z-10 -mx-4 flex gap-1.5 overflow-x-auto bg-porcelana/95 px-4 py-2.5"
            style={vidro(8)}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilter(cat.id)}
                aria-pressed={filter === cat.id}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-[12.5px] font-medium ${
                  filter === cat.id
                    ? 'border-carvao bg-carvao text-porcelana'
                    : 'border-carvao/15 bg-creme text-carvao/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {lista.map((product) => {
              const qty = noPedido.get(product.id)
              return (
                <li key={product.id} className="cartao flex flex-col overflow-hidden">
                  <button
                    type="button"
                    onClick={() => openProduct(product.id, { focus: false })}
                    className="flex-1 text-left"
                    aria-label={`Ver detalhes: ${product.name}`}
                  >
                    {/* aspect-square reserva o espaco antes de desenhar: no
                        navegador embutido a carga e sempre fria, e caixa que
                        nasce com altura zero empurra a lista inteira. */}
                    <span className="grid aspect-square place-items-center bg-creme">
                      <PieceThumb piece={product.piece} size={112} />
                    </span>
                    <span className="block px-2.5 pt-2">
                      <span className="block text-[13.5px] leading-snug text-carvao">{product.name}</span>
                      {/* O preco colado no nome, e nao no fim do cartao: e o
                          campo pelo qual a pessoa veio. */}
                      <span className="mt-0.5 block text-[15px] font-semibold text-brasa-texto">
                        {priceLabel(product)}
                      </span>
                      {/* Quando ha pedido minimo, o que importa nao e o preco da
                          unidade: e quanto sai o menor pedido possivel. "a partir
                          de R$ 12" com "min. 20" escondido em tipo pequeno era o
                          que fazia a pessoa montar um pedido de R$ 240 sem saber.
                          A conta e dos dados que ja existem — nada foi inventado. */}
                      <span className="mt-0.5 block text-[11.5px] text-carvao/70">
                        {product.leadDays} dias
                        {product.minQty > 1 && (
                          <>
                            {' · mín. '}
                            {product.minQty}
                            <span className="block text-carvao/60">
                              {product.from ? 'a partir de ' : ''}
                              {money(product.price * product.minQty)} o pedido
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                  </button>

                  <div className="px-2.5 pt-2 pb-2.5">
                    {qty ? (
                      <div className="flex items-center justify-between rounded-xl border border-carvao/12 bg-creme">
                        <button
                          type="button"
                          onClick={() =>
                            qty <= (product.minQty ?? 1) ? removeFromCart(product.id) : setQty(product.id, qty - 1)
                          }
                          aria-label={qty <= (product.minQty ?? 1) ? `Tirar ${product.name} do pedido` : 'Menos uma'}
                          className="grid h-11 w-11 place-items-center rounded-xl text-carvao/70 hover:text-carvao"
                        >
                          <IconMinus size={15} />
                        </button>
                        {/* `key` pela quantidade: com a pagina traduzida pelo
                            navegador o numero ficava no valor velho. */}
                        <span key={qty} className="text-[14px] font-semibold text-carvao">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(product.id, qty + 1)}
                          aria-label="Mais uma"
                          className="grid h-11 w-11 place-items-center rounded-xl text-carvao/70 hover:text-carvao"
                        >
                          <IconPlus size={15} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        className="btn-secundario min-h-11 w-full justify-center py-2 text-[13px]"
                      >
                        <IconPlus size={15} />
                        Adicionar
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Dizer que o desenho e desenho: nada aqui e foto da peca dela, e
              deixar isso implicito seria vender uma imagem que nao existe. */}
          <p className="mt-3 text-[12.5px] leading-relaxed text-carvao/60">
            {lista.length === products.length
              ? `${products.length} peças`
              : `${lista.length} de ${products.length} peças`}{' '}
            · valores de tabela; personalização sai por orçamento. As peças aparecem como desenho — ainda
            não há fotos delas aqui.
          </p>
        </section>

        <section id="encomendar" className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Como encomendar</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-carvao/70">{studio.pitch}</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {howToOrder.map((item) => (
              <li key={item.step} className="cartao flex gap-3 p-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brasa/12 font-display font-semibold text-brasa-texto">
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
            Pedir um orçamento
            <IconArrow size={16} />
          </button>
        </section>

        <section className="border-t border-carvao/10 py-8">
          <h2 className="text-[22px]">Projetos entregues</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {gallery.map((item) => (
              <li key={item.id} className="cartao overflow-hidden">
                {/* Igual ao painel de Projetos. A lista tinha ficado com o degrade
                    de espera quando as fotos entraram, e com "· {ano}" depois que
                    o ano saiu dos dados: os cinco cards diziam "Porcelana fria · ". */}
                <img
                  src={item.foto}
                  alt={item.title}
                  loading="lazy"
                  width="600"
                  height="400"
                  className="h-56 w-full object-cover"
                  style={{ background: item.palette[1] }}
                />
                <div className="p-3.5">
                  <h3 className="text-[14.5px]">{item.title}</h3>
                  <p className="mt-0.5 text-[12px] font-medium text-brasa-texto">{item.kind}</p>
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
          <p className="mt-1 text-[13.5px] text-carvao/70">
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

      <footer className="border-t border-carvao/10 py-6 text-center text-[12px] text-carvao/70">
        <span translate="no">{studio.name}</span> · {studio.city} · {studio.email}
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
                {/* `key` pelos valores: traduzida pelo navegador, a barra seguia
                    "Ver pedido · 1 peça". Ver src/lib/tradutor.js. */}
                <span key={`qtd-${count}-${isEstimate}`} className="block text-[12px] font-normal text-carvao/70">
                  Ver pedido · {plural(count, 'peça', 'peças')}
                  {isEstimate && ' · estimativa'}
                </span>
                <span key={`total-${total}`} className="block text-[16px] font-semibold text-carvao">
                  {money(total)}
                </span>
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
