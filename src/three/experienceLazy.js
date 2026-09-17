import { lazy } from 'react'
import { carregar } from '../proto/nav'

// O three + drei sao ~280 kB gzip do pacote. Quem entra em modo simples (ou cai
// nele por nao ter WebGL) nao precisa baixar nada disso, entao o 3D vive num
// chunk proprio. Fica fora do App.jsx para nao quebrar o Fast Refresh, que
// exige que um modulo de componente exporte so componentes.
//
// A variante de navegacao em teste (?nav=) viaja JUNTO, atras do mesmo
// carregador: se ela chegasse depois, a cena comecaria com a navegacao de hoje
// e trocaria de comportamento alguns segundos depois — que e a pior coisa que
// pode acontecer num teste de sensacao. Sem parametro na URL, `carregar()`
// devolve uma promessa ja resolvida: nenhuma requisicao a mais.
export const Experience = lazy(() =>
  Promise.all([import('./Experience'), carregar()]).then(([m]) => ({ default: m.Experience })),
)
