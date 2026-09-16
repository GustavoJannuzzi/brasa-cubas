import { useIsMobile } from '../../hooks/useMedia'
import { studio } from '../../data/studio'
import { money, plural } from '../../lib/format'
import { cartMessage } from '../../lib/whatsapp'
import { useCartSummary, useStore } from '../../store/useStore'
import { IconArrow, IconMinus, IconPlus, IconTrash, IconWhatsapp } from '../Icons'
import { Panel } from '../Panel'
import { PieceThumb } from '../PieceThumb'

function Linha({ line }) {
  const setQty = useStore((s) => s.setQty)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const openProduct = useStore((s) => s.openProduct)
  const isMobile = useIsMobile()
  // No modo simples nao ha cena para enquadrar: apontar a camera so mexeria
  // num 3D que ninguem esta vendo.
  const simpleMode = useStore((s) => s.simpleMode)
  const { product, qty, subtotal } = line

  return (
    <li className="cartao flex gap-3 p-3">
      <button
        type="button"
        onClick={() => openProduct(product.id, { focus: !isMobile && !simpleMode })}
        aria-label={`Ver ${product.name}`}
      >
        <PieceThumb piece={product.piece} size={58} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="min-w-0 flex-1 text-[14px] leading-snug font-medium text-carvao">{product.name}</p>
          <button
            type="button"
            onClick={() => removeFromCart(product.id)}
            aria-label={`Remover ${product.name}`}
            className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-carvao/55 transition-colors hover:bg-carvao/6 hover:text-brasa"
          >
            <IconTrash size={15} />
          </button>
        </div>
        <p className="mt-0.5 text-[12px] text-carvao/70">
          {money(product.price)} por {product.unit}
          {product.from && ' (a partir de)'}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center rounded-full border border-carvao/15 bg-porcelana">
            <button
              type="button"
              onClick={() => setQty(product.id, qty - 1)}
              disabled={qty <= product.minQty}
              className="grid h-8 w-8 place-items-center rounded-full text-carvao/70 disabled:opacity-30"
              aria-label="Diminuir"
            >
              <IconMinus size={14} />
            </button>
            <span className="min-w-8 text-center text-[13.5px] font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty(product.id, qty + 1)}
              className="grid h-8 w-8 place-items-center rounded-full text-carvao/70"
              aria-label="Aumentar"
            >
              <IconPlus size={14} />
            </button>
          </div>
          <span className="text-[14px] font-semibold text-carvao">{money(subtotal)}</span>
        </div>
      </div>
    </li>
  )
}

export function CartPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)
  const clearCart = useStore((s) => s.clearCart)
  const { lines, count, total, isEstimate } = useCartSummary()

  const maiorPrazo = lines.reduce((max, line) => Math.max(max, line.product.leadDays), 0)

  if (!lines.length) {
    return (
      <Panel title="Seu pedido" onClose={closePanel}>
        <div className="py-6 text-center">
          <p className="font-display text-[19px] text-carvao">Nada no pedido ainda</p>
          <p className="mx-auto mt-2 max-w-xs text-[13.5px] leading-relaxed text-carvao/70">
            Monte seu pedido escolhendo peças do catálogo. Nada é cobrado aqui: o pedido vira uma
            conversa no WhatsApp com a Isabela.
          </p>
          <button type="button" onClick={() => openPanel('produtos')} className="btn-principal mt-5">
            Ver os produtos
            <IconArrow size={16} />
          </button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title="Seu pedido"
      // Contava linhas: 39 lembrancinhas apareciam como "1 peça", contra as
      // "39 peças" da barra de baixo. Quem conta peca conta unidade.
      subtitle={`${plural(count, 'peça', 'peças')} · nada é cobrado pelo site`}
      onClose={closePanel}
      footer={
        <div className="mb-3 grid gap-2 md:mb-0">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] text-carvao/70">{isEstimate ? 'Estimativa' : 'Total'}</span>
            <span className="text-[19px] font-semibold text-carvao">{money(total)}</span>
          </div>
          <a
            href={cartMessage(lines, total, isEstimate)}
            target="_blank"
            rel="noreferrer"
            className="btn-principal w-full"
          >
            <IconWhatsapp size={18} />
            Fechar pedido no WhatsApp
          </a>
          <p className="text-center text-[11.5px] text-carvao/70">
            Abre uma conversa com o pedido escrito. Você confirma antes de pagar qualquer coisa.
          </p>
        </div>
      }
    >
      <ul className="grid gap-2.5">
        {lines.map((line) => (
          <Linha key={line.id} line={line} />
        ))}
      </ul>

      <div className="mt-4 grid gap-2 rounded-xl bg-carvao/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-carvao/70">
        <p>
          <strong className="font-semibold text-carvao">Prazo:</strong> cerca de {maiorPrazo} dias,
          contando da aprovação do esboço.
        </p>
        <p>
          <strong className="font-semibold text-carvao">Entrega:</strong> {studio.shipping}. O frete
          entra no fechamento, conforme o CEP.
        </p>
        {isEstimate && (
          <p>
            <strong className="font-semibold text-carvao">Sobre o valor:</strong> algumas peças são
            "a partir de" porque dependem da personalização. O valor final vem no orçamento.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => openPanel('produtos')} className="btn-fantasma -ml-1">
          Continuar escolhendo
        </button>
        <button type="button" onClick={clearCart} className="btn-fantasma text-[13px]">
          Limpar
        </button>
      </div>
    </Panel>
  )
}
