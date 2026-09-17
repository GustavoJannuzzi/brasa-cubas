import { proto } from '../bandeiras'

// Registro das variantes de navegacao.
//
// Tres cuidados, cada um por um motivo medido:
//
// 1. O modulo da variante viaja JUNTO com o pacote do 3D (ver experienceLazy),
//    atras do mesmo carregador. Se chegasse depois, a cena comecaria com a
//    navegacao de hoje e trocaria de comportamento no meio da sessao — que e
//    exatamente o que nao pode acontecer num teste de sensacao.
// 2. Sem parametro na URL, `carregar()` devolve uma promessa ja resolvida: zero
//    requisicao e zero latencia no caminho padrao.
// 3. A variante fica guardada aqui numa variavel de modulo para o CameraRig
//    poder ler de forma SINCRONA ao montar, sem estado de React no meio (estado
//    novo no App faria o Canvas reaplicar frameloop, dpr e shadows).

const CAMINHOS = {
  trilho: () => import('./trilho'),
  orbita: () => import('./orbita'),
  estacoes: () => import('./estacoes'),
}

let pronta = null

export const carregar = () => {
  const caminho = CAMINHOS[proto.nav]
  if (!caminho) return Promise.resolve(null)
  return caminho().then((m) => {
    pronta = m.default
    return pronta
  })
}

/** A variante ja carregada, ou null quando a navegacao e a de hoje. */
export const navegacaoDoProto = () => pronta
