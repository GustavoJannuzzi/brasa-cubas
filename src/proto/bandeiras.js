// Bandeiras de protótipo, lidas da URL uma vez só.
//
// Existem para o dono comparar variantes no celular dele. Quatro regras, e cada
// uma sai de um jeito de errar:
//
// 1. SEM nenhuma das chaves na URL, o site e' identico ao publicado: nenhum
//    modulo de variante e' baixado e o selo nao aparece. Esse e' o controle de
//    "o site continua o de hoje".
// 2. `ligado` e' "alguma chave esta na URL", e nao "algum valor difere do
//    padrao": com ?nav=atual o selo aparece e o padrao TAMBEM recebe voto. Sem
//    isso a comparacao nao fecha, porque o controle ficaria sem urna.
// 3. Valor desconhecido nao cai calado no padrao. ?nav=trilhoo entra em
//    `recusados`, e o selo denuncia — senao ele testaria o padrao achando que
//    testou a variante, e me contaria a conclusao errada.
// 4. Lista fechada, nunca Number() solto: ?teto=99 construiria um comodo de
//    99 m e o teste viraria outra coisa.
//
// O teto ja nasce em 3,05: essa virou a altura do ateliê depois do teste do dono
// no aparelho dele. `?teto=2.9` volta ao pe-direito antigo para comparar.
//
// Isto e' andaime: quando a variante vencedora for escolhida, a pasta inteira
// sai num commit so.

const NAVEGACOES = ['atual', 'trilho', 'orbita', 'estacoes']
const TETOS = ['2.9', '3.05', '3.2']

const params = new URLSearchParams(window.location.search)
const recusados = []

const escolher = (chave, valores, padrao) => {
  const v = params.get(chave)
  if (v === null) return padrao
  if (valores.includes(v)) return v
  recusados.push(`${chave}=${v}`)
  return padrao
}

const nav = escolher('nav', NAVEGACOES, 'atual')
const teto = escolher('teto', TETOS, '3.05')

export const proto = Object.freeze({
  nav,
  teto: Number(teto),
  // Alguma das tres chaves veio na URL, mesmo que com o valor padrao.
  ligado: params.has('nav') || params.has('teto'),
  recusados,
  // O que escrever no selo, para ele saber no celular o que esta testando.
  resumo: `nav=${nav} · teto=${teto}`,
})
