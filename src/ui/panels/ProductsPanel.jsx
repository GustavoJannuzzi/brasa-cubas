import { useMemo, useState } from 'react'
import { useIsMobile } from '../../hooks/useMedia'
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
          <span className="mt-0.5 block text-[12.5px] leading-snug text-carvao/60">{product.short}</span>
          <span className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-[15px] font-semibold text-brasa">{priceLabel(product)}</span>
            {product.minQty > 1 && (
              <span className="text-[11px] text-carvao/50">mín. {product.minQty} un</span>
            )}
          </span>
        </span>
      </button>

      <div className="flex border-t border-carvao/8">
        <button
          type="button"
          onClick={() => focusProductIn3D(product.id)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-medium text-carvao/70 transition-colors hover:bg-carvao/5"
        >
          <IconCube size={15} />
          Ver na prateleira
        </button>
        <span className="w-px bg-carvao/8" />
        <button
          type="button"
          onClick={() => addToCart(product.id)}
          className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-medium text-brasa transition-colors hover:bg-brasa/8"
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

  const lista = useMemo(
    () => (filter === 'todos' ? products : products.filter((p) => p.category === filter)),
    [filter],
  )

  return (
    <Panel
      title="Produtos"
      subtitle={`${products.length} peças no catálogo · toque numa peça para ver na prateleira`}
      onClose={closePanel}
      footer={
        <button
          type="button"
          onClick={() => openPanel('orcamento')}
          className="btn-principal mb-3 w-full md:mb-0"
        >
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

      <p className="mt-4 rounded-xl bg-carvao/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-carvao/65">
        Os valores são de tabela, para a peça como está na foto. Personalização de cor, tamanho
        ou quantidade muda o preço — nesse caso vale{' '}
        <button type="button" onClick={() => openPanel('orcamento')} className="font-semibold text-brasa underline">
          pedir um orçamento
        </button>
        .
      </p>
    </Panel>
  )
}
