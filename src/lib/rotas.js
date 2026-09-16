import { productById } from '../data/products'

/**
 * Mapa entre os paineis e o endereco da pagina.
 *
 * Os nomes do hash seguem o rotulo do menu, nao o nome interno do painel
 * ('projetos' e nao 'galeria', 'como-encomendar' e nao 'processo'): quem le
 * o link e uma pessoa no story da Isabela, nao o codigo.
 */
const PARA_HASH = {
  produtos: 'produtos',
  galeria: 'projetos',
  processo: 'como-encomendar',
  orcamento: 'orcamento',
  contato: 'contato',
  carrinho: 'pedido',
  ajuda: 'ajuda',
}

const DE_HASH = Object.fromEntries(Object.entries(PARA_HASH).map(([painel, h]) => [h, painel]))

/** Endereco que representa o estado atual. String vazia = nenhum painel. */
export function hashDoEstado(painel, produto) {
  if (!painel) return ''
  // A peca vive dentro do catalogo: sem id, o link cai na lista em vez de
  // abrir um detalhe vazio.
  if (painel === 'produto') return produto ? `#produto/${encodeURIComponent(produto)}` : '#produtos'
  const h = PARA_HASH[painel]
  return h ? `#${h}` : ''
}

/** Le o endereco. Hash desconhecido ou peca que nao existe mais nao quebra. */
export function estadoDoHash(hash) {
  const cru = (hash || '').replace(/^#/, '')
  if (!cru) return { painel: null, produto: null }

  const [cabeca, ...resto] = cru.split('/')
  if (cabeca === 'produto') {
    const id = decodeURIComponent(resto.join('/'))
    // Link antigo para uma peca que saiu do catalogo: abre a lista, que e o
    // lugar util, em vez de um painel em branco.
    return productById(id) ? { painel: 'produto', produto: id } : { painel: 'produtos', produto: null }
  }

  const painel = DE_HASH[decodeURIComponent(cabeca)]
  return painel ? { painel, produto: null } : { painel: null, produto: null }
}
