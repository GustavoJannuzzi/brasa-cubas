import { studio } from '../data/studio'
import { money, formatDateBR } from './format'

const link = (text) => `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(text)}`

export const whatsappUrl = link

export const plainHello = () =>
  link(`Oi! Vi o site do ateliê e queria tirar uma dúvida.`)

export const productMessage = (product, qty) =>
  link(
    [
      `Oi! Vim pelo site do ateliê.`,
      ``,
      `Tenho interesse em: ${product.name}`,
      `Quantidade: ${qty} ${product.unit}`,
      `Valor de tabela: ${product.from ? `a partir de ${money(product.price)}` : money(product.price)} por ${product.unit}`,
      ``,
      `Pode me confirmar prazo e valor final?`,
    ].join('\n'),
  )

// O texto do pedido existe separado do link do WhatsApp: se o navegador in-app
// nao repassar o wa.me para o aplicativo — e ele as vezes nao repassa —, o
// pedido montado precisa ter outra saida. E o mesmo conteudo em copiar e em
// e-mail, como ja acontecia no orcamento.
export const cartText = (lines, total, isEstimate) =>
  [
    `Oi! Vim pelo site do ateliê e montei um pedido:`,
    ``,
    ...lines.map((line) => `• ${line.qty}× ${line.product.name} — ${money(line.subtotal)}`),
    ``,
    `${isEstimate ? 'Estimativa' : 'Total'}: ${money(total)}`,
    isEstimate ? `(algumas peças são "a partir de", então o valor final depende da personalização)` : ``,
    ``,
    `Pode confirmar prazo e forma de pagamento?`,
  ]
    .filter(Boolean)
    .join('\n')

export const cartMessage = (lines, total, isEstimate) => link(cartText(lines, total, isEstimate))

export const cartMailto = (lines, total, isEstimate) =>
  `mailto:${studio.email}?subject=${encodeURIComponent('Pedido pelo site do ateliê')}&body=${encodeURIComponent(
    cartText(lines, total, isEstimate),
  )}`

// Texto do orcamento. Mesmo conteudo usado no "copiar" e no e-mail,
// para o usuario nunca ficar sem saida se nao usar WhatsApp.
export const quoteText = (quote) =>
  [
    `Pedido de orçamento — site do ateliê`,
    ``,
    `Peça: ${quote.kind || '(não informado)'}`,
    `Quantidade: ${quote.qty || '(não informado)'}`,
    quote.eventDate ? `Data do evento: ${formatDateBR(quote.eventDate)}` : `Data do evento: sem data definida`,
    quote.colors ? `Cores/tema: ${quote.colors}` : null,
    quote.details ? `Detalhes: ${quote.details}` : null,
    ``,
    `Nome: ${quote.name || '(não informado)'}`,
    `Contato (${quote.contactKind}): ${quote.contact || '(não informado)'}`,
  ]
    .filter((row) => row !== null)
    .join('\n')

export const quoteMessage = (quote) => link(quoteText(quote))

export const quoteMailto = (quote) =>
  `mailto:${studio.email}?subject=${encodeURIComponent('Pedido de orçamento pelo site')}&body=${encodeURIComponent(
    quoteText(quote),
  )}`
