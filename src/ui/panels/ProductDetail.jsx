import { useEffect, useState } from 'react'
import { productById } from '../../data/products'
import { studio } from '../../data/studio'
import { money, plural, priceLabel } from '../../lib/format'
import { productMessage } from '../../lib/whatsapp'
import { useStore } from '../../store/useStore'
import { IconCheck, IconClock, IconCube, IconMinus, IconPlus, IconRuler, IconTruck, IconWhatsapp } from '../Icons'
import { Panel } from '../Panel'
import { PieceThumb } from '../PieceThumb'

function Ficha({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px] leading-snug text-carvao/70">
      <Icon size={15} className="mt-px shrink-0 text-carvao/55" />
      <span>{children}</span>
    </li>
  )
}

export function ProductDetail() {
  const id = useStore((s) => s.selectedProduct)
  const closePanel = useStore((s) => s.closePanel)
  const backToProducts = useStore((s) => s.backToProducts)
  const openPanel = useStore((s) => s.openPanel)
  const addToCart = useStore((s) => s.addToCart)
  const focusProductIn3D = useStore((s) => s.focusProductIn3D)
  const product = productById(id)

  const [qty, setQty] = useState(product?.minQty ?? 1)
  useEffect(() => setQty(product?.minQty ?? 1), [product?.id, product?.minQty])

  if (!product) return null

  const total = product.price * qty

  return (
    <Panel
      title={product.name}
      subtitle={product.short}
      onClose={closePanel}
      onBack={backToProducts}
      footer={
        <div className="mb-3 flex flex-col gap-2 md:mb-0">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-carvao/70">
              {plural(qty, 'peça', 'peças')}
              {product.from && ' · estimativa'}
            </span>
            <span className="text-[17px] font-semibold text-carvao">{money(total)}</span>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => addToCart(product.id, qty)} className="btn-principal flex-1">
              Adicionar ao pedido
            </button>
            <a
              href={productMessage(product, qty)}
              target="_blank"
              rel="noreferrer"
              className="btn-secundario shrink-0"
              aria-label="Falar sobre esta peça no WhatsApp"
            >
              <IconWhatsapp size={18} />
            </a>
          </div>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <PieceThumb piece={product.piece} size={120} />
          <button
            type="button"
            onClick={() => focusProductIn3D(product.id)}
            className="mt-1.5 flex w-[120px] items-center justify-center gap-1 rounded-lg border border-carvao/12 py-1.5 text-[11.5px] font-medium text-carvao/70"
          >
            <IconCube size={13} />
            Ver na prateleira
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[22px] leading-none font-semibold text-brasa-texto">{priceLabel(product)}</p>
          <p className="mt-1 text-[12px] text-carvao/70">
            por {product.unit}
            {product.minQty > 1 && ` · pedido mínimo de ${product.minQty}`}
          </p>
          <ul className="mt-3 grid gap-1.5">
            <Ficha icon={IconRuler}>{product.sizeCm}</Ficha>
            <Ficha icon={IconClock}>Produção em cerca de {product.leadDays} dias</Ficha>
            <Ficha icon={IconTruck}>{studio.shipping}</Ficha>
          </ul>
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {product.highlights.map((h) => (
          <li
            key={h}
            className="flex items-center gap-1 rounded-full bg-salvia/18 px-2.5 py-1 text-[11.5px] font-medium text-carvao/75"
          >
            <IconCheck size={13} className="text-salvia" />
            {h}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[14px] leading-relaxed text-carvao/80">{product.description}</p>

      <div className="mt-5">
        <span className="etiqueta">Quantidade</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-full border border-carvao/15 bg-creme">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(product.minQty, q - 1))}
              disabled={qty <= product.minQty}
              // 44 px: alvo de toque minimo.
              className="grid h-11 w-11 place-items-center rounded-full text-carvao/70 disabled:opacity-30"
              aria-label={
                qty <= product.minQty
                  ? `Diminuir: já está no mínimo de ${product.minQty}`
                  : 'Diminuir quantidade'
              }
            >
              <IconMinus size={16} />
            </button>
            <span className="min-w-10 text-center text-[15px] font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="grid h-11 w-11 place-items-center rounded-full text-carvao/70"
              aria-label="Aumentar quantidade"
            >
              <IconPlus size={16} />
            </button>
          </div>
          {product.minQty > 1 && (
            <span className="text-[12px] text-carvao/70">o mínimo é {product.minQty} unidades</span>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-carvao/5 px-3.5 py-3">
        <p className="text-[12.5px] leading-relaxed text-carvao/70">
          Quer esta peça em outra cor, outro tamanho ou com um detalhe seu?{' '}
          <button
            type="button"
            onClick={() => openPanel('orcamento')}
            className="font-semibold text-brasa-texto underline"
          >
            Peça um orçamento
          </button>{' '}
          — é assim que sai a maior parte das encomendas.
        </p>
      </div>
    </Panel>
  )
}
