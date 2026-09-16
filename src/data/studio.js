// Dados do negocio. Tudo aqui e placeholder de teste: trocar pelos dados reais
// da Isabela antes de publicar (telefone, e-mail, prazos, redes).
export const studio = {
  name: 'Brasa Cubas',
  tagline: 'Ateliê de porcelana fria',
  pitch: 'Peças modeladas e pintadas à mão, uma a uma, sob encomenda.',
  city: 'Foz do Iguaçu, PR',
  whatsapp: '5551999990000', // formato internacional, sem + nem espacos
  whatsappLabel: '(51) 99999-0000',
  email: 'atelie@brasacubas.com.br',
  instagram: '@brasacubas',
  instagramUrl: 'https://instagram.com/brasacubas',
  hours: 'Seg a sex, 9h às 18h',
  answerTime: 'Resposta em até 1 dia útil',
  shipping: 'Envio para todo o Brasil · Entrega em mãos em Foz do Iguaçu',
  minLeadDays: 10,
}

// Passo a passo que aparece no painel "Como encomendar".
// O usuario precisa entender o fluxo antes de decidir pedir.
export const howToOrder = [
  {
    step: 1,
    title: 'Escolha ou descreva',
    text: 'Pegue uma peça do catálogo ou conte a ideia que você tem na cabeça.',
  },
  {
    step: 2,
    title: 'Peça o orçamento',
    text: 'Data do evento, quantidade e cores. Leva um minuto e não tem compromisso.',
  },
  {
    step: 3,
    title: 'Aprove o desenho',
    text: 'Envio um esboço com valor e prazo. Só começo a modelar depois do seu ok.',
  },
  {
    step: 4,
    title: 'Produção e entrega',
    text: `Peças feitas à mão levam a partir de 10 dias. Pagamento em 50% + 50%.`,
  },
]

export const faq = [
  {
    q: 'O que é porcelana fria?',
    a: 'É uma massa de modelar artesanal, que seca ao ar e fica leve e resistente. Não é cerâmica de forno: por isso o acabamento é mais delicado e permite muito detalhe, especialmente em flores.',
  },
  {
    q: 'Qual o prazo de produção?',
    a: 'A partir de 10 dias para peças do catálogo e de 15 a 25 dias para encomendas personalizadas, dependendo da agenda. Em época de formatura e casamento, peça com antecedência.',
  },
  {
    q: 'Dá para fazer nas cores da minha festa?',
    a: 'Sim. A massa é pigmentada à mão, então consigo chegar bem perto de qualquer cor. Me manda uma foto ou o código da paleta no orçamento.',
  },
  {
    q: 'Como as peças são enviadas?',
    a: 'Cada peça vai embalada em caixa rígida com berço de espuma. Envio por Correios ou transportadora, com rastreio. Em Foz do Iguaçu, posso entregar em mãos.',
  },
  {
    q: 'Tem pedido mínimo?',
    a: 'Só para lembrancinhas, que saem a partir de 20 unidades. O resto pode ser uma peça só.',
  },
]
