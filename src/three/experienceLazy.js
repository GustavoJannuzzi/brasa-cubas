import { lazy } from 'react'

// O three + drei sao ~280 kB gzip do pacote. Quem entra em modo simples (ou cai
// nele por nao ter WebGL) nao precisa baixar nada disso, entao o 3D vive num
// chunk proprio. Fica fora do App.jsx para nao quebrar o Fast Refresh, que
// exige que um modulo de componente exporte so componentes.
export const Experience = lazy(() =>
  import('./Experience').then((m) => ({ default: m.Experience })),
)
