import { rendererDeSoftware } from './webgl'

const CHAVE = 'bc-tier'

/**
 * Nivel de qualidade do APARELHO, decidido uma vez.
 *
 * Antes saia da largura da janela (`isMobile`, 767 px). Com isso o celular
 * deitado (844 x 390) e o tablet caiam em 'alta' e recebiam sombra 2048,
 * antialias e dpr 1,75 — o caminho mais pesado, justamente em quem girou o
 * aparelho para ver o ateliê maior. E girar com o site aberto trocava
 * `shadows`, o que faz o three recompilar todos os programas e refazer as
 * quinze plantas no meio do gesto. O `antialias` nem mudava: o renderer so e
 * criado uma vez, entao quem abrisse deitado ficava com MSAA para sempre.
 *
 * Largura e orientacao voltam a mexer so no enquadramento e no campo de visao.
 */
export function tierDoAparelho() {
  if (typeof window === 'undefined') return 'alta'

  // Renderizador por software nao aguenta esta cena em nenhuma qualidade, mas
  // em baixa ele ao menos desenha.
  if (rendererDeSoftware()) return 'baixa'

  // Toque grosso = celular ou tablet. E o publico que vem do link na bio.
  if (window.matchMedia('(pointer: coarse)').matches) return 'baixa'

  const nucleos = navigator.hardwareConcurrency ?? 4
  // deviceMemory so existe em navegador Chromium; o padrao evita rebaixar
  // maquina boa por falta de informacao.
  const memoria = navigator.deviceMemory ?? 4
  if (nucleos <= 4 || memoria <= 2) return 'baixa'

  return 'alta'
}

/**
 * A visita passada travou e o site rebaixou. Comecar ja no degrau certo evita
 * repetir o engasgo da queda toda vez que a pessoa volta.
 */
export function foiRebaixado() {
  try {
    return localStorage.getItem(CHAVE) === 'baixa'
  } catch {
    // Aba anonima ou storage bloqueado: seguir sem memoria e melhor que quebrar.
    return false
  }
}

export function marcarRebaixado() {
  try {
    localStorage.setItem(CHAVE, 'baixa')
  } catch {
    /* sem storage, a proxima visita mede de novo */
  }
}
