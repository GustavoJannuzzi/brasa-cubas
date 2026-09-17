import { useMemo, useState } from 'react'
import { useIsMobile, useIsTouch } from '../../hooks/useMedia'
import { categories, products } from '../../data/products'
import { priceLabel } from '../../lib/format'
import { useStore } from '../../store/useStore'
import { IconArrow, IconCube, IconPlus } from '../Icons'
import { Panel } from '../Panel'
import { PieceThumb } from '../PieceThumb'

function Cartao({ product }) {
  const openProduct = useStore((s) => s.openProduct)
  const focusProductIn3D = useStore((s) => s.focusProductIn3D)
  const addToCart = useStore((s) => s.addToCart)
  // Pelo link #produtos o painel abre tambem no modo lista, onde "Ver na
  // prateleira" so fechava o painel: sem prateleira na tela, o botao sai.
  const simpleMode = useStore((s) => s.simpleMode)
  const isMobile = useIsMobile()

  return (
    <li className="cartao overflow-hidden">
      <button
        type="button"
        onClick={() => openProduct(product.id, { focus: !isMobile })}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <PieceThumb piece={product.piece} size={70} />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-snug font-medium text-carvao">{product.name}</span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-carvao/70">{product.short}</span>
          <span className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold text-brasa-texto">{priceLabel(product)}</span>
            {product.minQty > 1 && (
              <span className="text-[11px] text-carvao/70">mín. {product.minQty} un</span>
            )}
          </span>
        </span>
      </button>

      {/* Os dois botoes do rodape do cartao em 44 de altura, o minimo de alvo de
          toque (MI-08). Estavam em 39 (py-2.5), e sao 22 alvos: a maior parte
          da lista de alvos pequenos do site. min-h-11 no lugar do padding porque
          o items-center ja centraliza, e py-3 daria 43, ainda abaixo. */}
      <div className="flex border-t border-carvao/8">
        {!simpleMode && (
          <>
            <button
              type="button"
              onClick={() => focusProductIn3D(product.id)}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-[12.5px] font-medium text-carvao/70 transition-colors hover:bg-carvao/5"
            >
              <IconCube size={15} />
              Ver na prateleira
            </button>
            <span className="w-px bg-carvao/8" />
          </>
        )}
        <button
          type="button"
          onClick={() => addToCart(product.id)}
          className="flex min-h-11 flex-1 items-center justify-center gap-1.5 text-[12.5px] font-medium text-brasa-texto transition-colors hover:bg-brasa/8"
        >
          <IconPlus size={15} />
          Adicionar
        </button>
      </div>
    </li>
  )
}

export function ProductsPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)
  const [filter, setFilter] = useState('todos')
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()

  const lista = useMemo(
    () => (filter === 'todos' ? products : products.filter((p) => p.category === filter)),
    [filter],
  )

  return (
    <Panel
      title="Produtos"
      // O que o toque no cartao faz depende da largura (ver Cartao): na folha do
      // celular abre so o detalhe, sem destacar a peca atras. Prometer a prateleira
      // ali era prometer o que nao acontece.
      subtitle={`${products.length} peças no catálogo · ${isTouch ? 'toque' : 'clique'} numa peça para ${
        isMobile ? 'ver os detalhes' : 'ver na prateleira'
      }`}
      onClose={closePanel}
      footer={
        <button
          type="button"
          onClick={() => openPanel('orcamento')}
          className="btn-principal mb-3 w-full text-balance md:mb-0"
        >
          {/* text-balance: em 375 o texto quebrava como "Nao achou o que queria?
              Peca sob / medida", com "medida" sozinha na segunda linha (medido,
              caractere a caractere). No desktop cabe numa linha, e o balance nao
              cria quebra — so equilibra as que ja existem. */}
          Não achou o que queria? Peça sob medida
          <IconArrow size={16} />
        </button>
      }
    >
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 md:-mx-5 md:px-5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilter(cat.id)}
            aria-pressed={filter === cat.id}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              filter === cat.id
                ? 'border-carvao bg-carvao text-porcelana'
                : 'border-carvao/15 bg-creme text-carvao/70'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-2.5">
        {lista.map((product) => (
          <Cartao key={product.id} product={product} />
        ))}
      </ul>

      <p className="mt-4 rounded-xl bg-carvao/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-carvao/70">
        Os valores são de tabela, para a peça como está na foto. Personalização de cor, tamanho
        ou quantidade muda o preço — nesse caso vale{' '}
        <button type="button" onClick={() => openPanel('orcamento')} className="font-semibold text-brasa-texto underline">
          pedir um orçamento
        </button>
        .
      </p>
    </Panel>
  )
}
