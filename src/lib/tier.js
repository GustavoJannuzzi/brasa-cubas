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

// Um rebaixamento nao pode valer para sempre. Na primeira versao ele era
// permanente, e um engasgo de um dia ruim — outra aba pesada, notebook em
// economia de bateria, um download rodando — condenava TODAS as visitas
// seguintes naquele navegador, sem aviso e sem volta. Medido aqui: uma maquina
// que `tierDoAparelho()` classifica como 'alta' abrindo com sombra desligada e
// dpr 1 por causa de um disparo antigo.
const VALIDADE = 7 * 24 * 60 * 60 * 1000

/**
 * A visita passada travou e o site rebaixou. Comecar ja no degrau certo evita
 * repetir o engasgo da queda toda vez que a pessoa volta — mas o registro
 * vence, e a propria sessao pode desfaze-lo se o aparelho provar que da conta.
 */
export function foiRebaixado() {
  try {
    const cru = localStorage.getItem(CHAVE)
    if (!cru) return false

    // Formato antigo, sem data: honra uma vez e regrava ja datado.
    if (cru === 'baixa') {
      marcarRebaixado()
      return true
    }

    const { quando } = JSON.parse(cru)
    if (!quando || Date.now() - quando > VALIDADE) {
      limparRebaixamento()
      return false
    }
    return true
  } catch {
    // Aba anonima, storage bloqueado ou registro corrompido: seguir sem
    // memoria e melhor que quebrar.
    return false
  }
}

export function marcarRebaixado() {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ nivel: 'baixa', quando: Date.now() }))
  } catch {
    /* sem storage, a proxima visita mede de novo */
  }
}

export function limparRebaixamento() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    /* idem */
  }
}
