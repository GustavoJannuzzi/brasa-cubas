import { productById, products } from '../data/products'

/**
 * Prazo de producao por tipo de peca do formulario.
 *
 * Os numeros sao DERIVADOS do catalogo (o maior leadDays da familia), nunca
 * escritos aqui: a promessa que o site faz acompanha os dados das pecas. Se
 * uma peca mudar de prazo, o aviso do orcamento muda junto.
 *
 * 'Outra coisa' — e qualquer tipo escrito a mao — nao tem familia: vale a
 * faixa do catalogo inteiro.
 */
const FAMILIA = {
  'Topo de bolo': { categoria: 'topo-de-bolo' },
  'Arranjo de flores': { categoria: 'flores' },
  Lembrancinhas: { peca: 'lembrancinha-vasinho' },
  'Boneco personalizado': { peca: 'figura-personalizada' },
  'Peça decorativa': { categoria: 'decoracao' },
}

const TODOS = products.map((p) => p.leadDays)
const FAIXA = { min: Math.min(...TODOS), max: Math.max(...TODOS) }

/** { dias } para um tipo conhecido, { min, max } quando so da para dar a faixa. */
export function prazoDoTipo(kind) {
  const familia = FAMILIA[(kind || '').trim()]

  if (familia?.peca) {
    const peca = productById(familia.peca)
    if (peca) return { dias: peca.leadDays }
  }

  if (familia?.categoria) {
    const daFamilia = products.filter((p) => p.category === familia.categoria)
    if (daFamilia.length) return { dias: Math.max(...daFamilia.map((p) => p.leadDays)) }
  }

  return { ...FAIXA }
}

/** Abaixo disto e aperto certo. */
export const diasDeReferencia = (prazo) => prazo.dias ?? prazo.min

/**
 * A partir disto cabe com folga. Para um tipo conhecido e o mesmo numero, e
 * so existe um degrau; numa faixa ha um meio ("pode dar, depende da agenda")
 * que nao pode ser vendido como tempo de sobra.
 */
export const tetoDoPrazo = (prazo) => prazo.dias ?? prazo.max

/** "20 dias" ou "de 10 a 25 dias" — o pedaco que entra no meio da frase. */
export const prazoEmTexto = (prazo) =>
  prazo.dias != null ? `${prazo.dias} dias` : `de ${prazo.min} a ${prazo.max} dias`
