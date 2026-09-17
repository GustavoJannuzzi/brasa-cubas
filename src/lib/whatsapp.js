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
    isEstimate ? `(algumas peças são "a partir de", então o valor final depende da personalização)` : null,
    ``,
    `Pode confirmar prazo e forma de pagamento?`,
  ]
    // So tira a nota que nao se aplica. Com .filter(Boolean) saiam tambem as
    // linhas em branco acima, e a mensagem chegava toda grudada (medido: 0 linhas
    // em branco; o orcamento, que ja filtrava so null, tinha as dele).
    .filter((row) => row !== null)
    .join('\n')

export const cartMessage = (lines, total, isEstimate) => link(cartText(lines, total, isEstimate))

export const cartMailto = (lines, total, isEstimate) =>
  `mailto:${studio.email}?subject=${encodeURIComponent('Pedido pelo site do ateliê')}&body=${encodeURIComponent(
    cartText(lines, total, isEstimate),
  )}`

// Formas de contato do orcamento. Moram aqui, e nao no painel, porque a mensagem
// tambem precisa do rotulo: com o id, a Isabela recebia "Contato (whatsapp)".
// `autoComplete` e o proposito do campo (WCAG 1.3.5): o celular oferece o
// proprio telefone ou e-mail em vez de pedir para digitar. Instagram nao tem
// token padrao; `off` evita o navegador sugerir o e-mail ali.
export const CONTATOS = [
  { id: 'whatsapp', label: 'WhatsApp', placeholder: '(51) 99999-0000', type: 'tel', autoComplete: 'tel' },
  { id: 'email', label: 'E-mail', placeholder: 'voce@email.com', type: 'email', autoComplete: 'email' },
  { id: 'instagram', label: 'Instagram', placeholder: '@seuperfil', type: 'text', autoComplete: 'off' },
]

const rotuloDoContato = (id) => CONTATOS.find((c) => c.id === id)?.label ?? id

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
    `Contato (${rotuloDoContato(quote.contactKind)}): ${quote.contact || '(não informado)'}`,
  ]
    .filter((row) => row !== null)
    .join('\n')

export const quoteMessage = (quote) => link(quoteText(quote))

export const quoteMailto = (quote) =>
  `mailto:${studio.email}?subject=${encodeURIComponent('Pedido de orçamento pelo site')}&body=${encodeURIComponent(
    quoteText(quote),
  )}`
