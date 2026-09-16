// Sonda de WebGL, feita ANTES de montar o Canvas.
//
// O trafego vem de link na bio: navegador in-app, celular mediano. Ali o WebGL
// as vezes nao existe e as vezes existe so por software. Sem esta sonda, o
// aparelho que nao abre 3D fica num loader que nunca termina — e a pessoa vai
// embora sem ver preco.

/** Um contexto de teste, descartado em seguida. null quando nao ha WebGL. */
const contextoDeTeste = () => {
  try {
    const tela = document.createElement('canvas')
    return tela.getContext('webgl2') || tela.getContext('webgl') || null
  } catch {
    return null
  }
}

export const temWebGL = () => contextoDeTeste() !== null

/**
 * Renderizador por software (SwiftShader, llvmpipe, Mesa em VM). Abre WebGL,
 * mas leva dezenas de segundos para o primeiro quadro de uma cena como esta.
 * Quando nao da para saber (a extensao de debug pode estar bloqueada), devolve
 * false: melhor tentar o 3D do que mandar alguem para a lista sem motivo.
 */
export const rendererDeSoftware = () => {
  const ctx = contextoDeTeste()
  if (!ctx) return false
  try {
    const debug = ctx.getExtension('WEBGL_debug_renderer_info')
    if (!debug) return false
    const nome = String(ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL) || '')
    return /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(nome)
  } catch {
    return false
  }
}
