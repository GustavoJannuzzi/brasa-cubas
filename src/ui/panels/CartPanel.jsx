import { useEffect, useState } from 'react'
import { useIsMobile } from '../../hooks/useMedia'
import { studio } from '../../data/studio'
import { money, plural } from '../../lib/format'
import { cartMailto, cartMessage, cartText } from '../../lib/whatsapp'
import { useCartSummary, useStore } from '../../store/useStore'
import { IconArrow, IconCopy, IconMail, IconMinus, IconPlus, IconTrash, IconWhatsapp } from '../Icons'
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
  const toast = useStore((s) => s.toast)
  const { product, qty, subtotal } = line

  const noMinimo = qty <= product.minQty
  const emLote = product.minQty >= 10
  const [rascunho, setRascunho] = useState(String(qty))
  // O valor pode mudar por fora (stepper, desfazer): o campo acompanha.
  useEffect(() => setRascunho(String(qty)), [qty])

  const confirmar = () => {
    const n = Number(rascunho)
    if (!Number.isFinite(n) || n < product.minQty) {
      setQty(product.id, product.minQty)
      // Corrigir em silencio faria a pessoa achar que o site ignorou o que ela
      // digitou.
      toast(`Mínimo de ${product.minQty} ${product.unit} — ajustei`, { chave: `min:${product.id}` })
      return
    }
    setQty(product.id, n)
  }

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
          {/* 44x44 como o seletor de quantidade logo abaixo (MI-08); estava em
              27x27 — o menor alvo de toque do site, na mesma tela do seletor que
              ja tinha sido corrigido. As margens negativas devolvem o espaco que
              a caixa ganhou, para o icone ficar no mesmo lugar e a linha do nome
              nao crescer. A sobra de baixo cai sobre o texto do preco, que nao e
              clicavel, e fica acima do seletor: nao rouba toque de ninguem. */}
          <button
            type="button"
            onClick={(e) => {
              // A linha some com o foco dentro: medido com Enter, ele caia no body.
              // Vai antes para a linha vizinha (a de baixo, senao a de cima) ou,
              // sem vizinha, para o painel.
              const linha = e.currentTarget.closest('li')
              const vizinha = linha?.nextElementSibling ?? linha?.previousElementSibling
              ;(vizinha?.querySelector('button') ?? e.currentTarget.closest('[role="dialog"]'))?.focus()
              removeFromCart(product.id)
            }}
            aria-label={`Remover ${product.name}`}
            className="-my-3 -mr-3 grid h-11 w-11 shrink-0 place-items-center rounded-full text-carvao/55 transition-colors hover:bg-carvao/6 hover:text-brasa"
          >
            <IconTrash size={15} />
          </button>
        </div>
        <p className="mt-0.5 text-[12px] text-carvao/70">
          {money(product.price)} por {product.unit}
          {product.from && ' (a partir de)'}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          <div className="flex items-center rounded-full border border-carvao/15 bg-porcelana">
            <button
              type="button"
              onClick={() => setQty(product.id, qty - 1)}
              // aria-disabled, e nao disabled: com o foco no botao, chegar ao
              // minimo o desabilitava e o foco caia no body (medido com Enter,
              // 21 -> 20). O clique no minimo ja nao faz nada (setQty limita).
              aria-disabled={noMinimo || undefined}
              // 44 px e o minimo de alvo de toque; estavam em 32.
              className="grid h-11 w-11 place-items-center rounded-full text-carvao/70 aria-disabled:opacity-30"
              // O "−" apagado sem explicacao parecia defeito.
              aria-label={noMinimo ? `Diminuir: já está no mínimo de ${product.minQty}` : 'Diminuir'}
            >
              <IconMinus size={16} />
            </button>

            {emLote ? (
              // Lembrancinha vai de 20 a 80 unidades: chegar la de um em um
              // cansa, erra e faz desistir.
              <input
                inputMode="numeric"
                value={rascunho}
                onChange={(e) => setRascunho(e.target.value.replace(/\D/g, ''))}
                onBlur={confirmar}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
                aria-label={`Quantidade de ${product.name}`}
                // Sem `outline-none`: a utilitaria ganhava do anel de foco geral e
                // o campo focado pelo Tab nao mostrava nada alem do cursor.
                className="w-14 bg-transparent text-center text-[15px] font-semibold tabular-nums focus-visible:rounded-md"
              />
            ) : (
              <span className="min-w-10 text-center text-[15px] font-semibold tabular-nums">{qty}</span>
            )}

            <button
              type="button"
              onClick={() => setQty(product.id, qty + 1)}
              className="grid h-11 w-11 place-items-center rounded-full text-carvao/70"
              aria-label="Aumentar"
            >
              <IconPlus size={16} />
            </button>
          </div>

          {noMinimo && product.minQty > 1 && (
            <span className="text-[12px] text-carvao/70">mín. {product.minQty}</span>
          )}
          <span className="ml-auto text-[14px] font-semibold text-carvao">{money(subtotal)}</span>
        </div>
      </div>
    </li>
  )
}

export function CartPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)
  const clearCart = useStore((s) => s.clearCart)
  const toast = useStore((s) => s.toast)
  const { lines, count, total, isEstimate } = useCartSummary()

  // A saida pelo WhatsApp abre outra aba e nao deixa rastro aqui. Na volta, o
  // pedido continua cheio e ninguem sabe se ja foi: ou manda de novo, ou
  // desiste. Este estado e o que permite a volta ter o que dizer.
  const [mandou, setMandou] = useState(false)
  const [textoAberto, setTextoAberto] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(cartText(lines, total, isEstimate))
      toast('Pedido copiado')
    } catch {
      // Sem clipboard (navegador in-app antigo, contexto nao seguro): mostrar o
      // texto e melhor do que so dizer "nao consegui".
      setTextoAberto(true)
      toast('Não consegui copiar — o texto está logo abaixo para selecionar')
    }
  }

  const jaMandei = () => {
    clearCart()
    setMandou(false)
  }

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
            // Sem preventDefault: o link continua abrindo normalmente. O clique
            // so registra que a pessoa saiu.
            onClick={() => setMandou(true)}
            className="btn-principal w-full"
          >
            <IconWhatsapp size={18} />
            Fechar pedido no WhatsApp
          </a>

          {mandou ? (
            <div className="grid gap-1.5 rounded-xl bg-carvao/5 px-3 py-2.5 text-center text-[12px] text-carvao/70">
              <span>Não abriu o WhatsApp?</span>
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <button
                  type="button"
                  onClick={copiar}
                  className="inline-flex items-center gap-1 font-semibold text-brasa-texto underline"
                >
                  <IconCopy size={13} />
                  Copiar pedido
                </button>
                <a
                  href={cartMailto(lines, total, isEstimate)}
                  className="inline-flex items-center gap-1 font-semibold text-brasa-texto underline"
                >
                  <IconMail size={13} />
                  Por e-mail
                </a>
                <button type="button" onClick={jaMandei} className="font-semibold text-brasa-texto underline">
                  Já enviei, esvaziar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-center text-[11.5px] text-carvao/70">
              Abre uma conversa com o pedido escrito. Você confirma antes de pagar qualquer coisa.
            </p>
          )}

          {textoAberto && (
            <pre className="rolagem-fina max-h-40 overflow-auto rounded-xl border border-carvao/10 bg-creme p-3 text-[12px] leading-relaxed whitespace-pre-wrap text-carvao/80">
              {cartText(lines, total, isEstimate)}
            </pre>
          )}
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
        {/* 44 de altura, como o seletor de quantidade e o Remover. Estavam em 30
            e 29: os menores alvos que sobravam no carrinho. */}
        <button type="button" onClick={() => openPanel('produtos')} className="btn-fantasma -ml-1 min-h-11">
          Continuar escolhendo
        </button>
        <button type="button" onClick={clearCart} className="btn-fantasma min-h-11 text-[13px]">
          Limpar
        </button>
      </div>
    </Panel>
  )
}
