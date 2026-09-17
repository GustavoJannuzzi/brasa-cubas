// Sonda de WebGL, feita ANTES de montar o Canvas.
//
// O trafego vem de link na bio: navegador in-app, celular mediano. Ali o WebGL
// as vezes nao existe e as vezes existe so por software. Sem esta sonda, o
// aparelho que nao abre 3D fica num loader que nunca termina — e a pessoa vai
// embora sem ver preco.

/**
 * Renderizador por software (SwiftShader, llvmpipe, Mesa em VM). Abre WebGL,
 * mas leva dezenas de segundos para o primeiro quadro de uma cena como esta.
 * Quando nao da para saber (a extensao de debug pode estar bloqueada), devolve
 * false: melhor tentar o 3D do que mandar alguem para a lista sem motivo.
 */
const porSoftware = (ctx) => {
  try {
    const debug = ctx.getExtension('WEBGL_debug_renderer_info')
    if (!debug) return false
    const nome = String(ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL) || '')
    return /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(nome)
  } catch {
    return false
  }
}

// Um contexto de teste para a pagina inteira. Cada pergunta abria o seu, e cada
// um custa uma ida ao processo da GPU: 56 e 27 ms de CPU na carga, medidos no
// dev a 1x. As duas respostas saem do mesmo contexto, que depois fica para a
// coleta de lixo. Nao ha `loseContext()` de proposito: o Chrome escreve um
// aviso no console a cada chamada.
let sonda = null
const sondar = () => {
  if (sonda) return sonda
  let ctx = null
  try {
    const tela = document.createElement('canvas')
    // So WebGL2: o three desta versao nao roda em WebGL1 (saiu no r163). Aceitar
    // o 'webgl' como reserva mandava o aparelho que so tem WebGL1 para o
    // carregador — o renderer falhava ("Error creating WebGL context"), nenhuma
    // barreira de erro via, e a tela ficava em "Preparando a bancada…" para
    // sempre (medido simulando `getContext('webgl2')` nulo). Sem WebGL2, lista.
    ctx = tela.getContext('webgl2')
  } catch {
    ctx = null
  }
  sonda = { temWebGL: ctx !== null, software: ctx ? porSoftware(ctx) : false }
  return sonda
}

export const temWebGL = () => sondar().temWebGL

export const rendererDeSoftware = () => sondar().software
