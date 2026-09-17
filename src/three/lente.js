import * as THREE from 'three'

// A conta da abertura da camera mora aqui, e nao dentro do CameraFov, porque as
// etiquetas da prateleira precisam da MESMA conta para saber quanto espaco tem
// entre uma vaga e outra. Duas copias divergiriam em silencio.

// Cobertura horizontal que a abertura do celular precisa ter, em graus. E ela
// que decide o enquadramento: o que tem de caber — mural a esquerda, estante a
// direita — esta espalhado na HORIZONTAL.
const CAMPO_HORIZONTAL = 32

// Cobertura horizontal MINIMA fora do celular. O fov vertical 38 e de tela
// deitada; numa tela em pe com largura de desktop (iPad em pe, 768x1024) ele
// cobria so 29 graus na horizontal, contra 58 no 16:10, e na prateleira quatro
// etiquetas saiam cortadas nas bordas. Abaixo desta cobertura o vertical cresce
// ate alcanca-la. Em tela deitada (4:3 ja cobre 49) nada muda: so entra abaixo da
// proporcao ~1,03.
const CAMPO_HORIZONTAL_MINIMO = 39

// Largura que a gaveta do desktop tira da cena: w-[27rem] + right-4 em Panel.jsx.
// Os dois andam juntos.
const GAVETA_REM = 28

export const larguraDaGaveta = () =>
  GAVETA_REM * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)

/**
 * Fov VERTICAL, em graus, para uma area de `largura` x `altura` px. Fora do
 * celular, `largura` e a area LIVRE (sem a gaveta, quando aberta).
 */
export function fovVertical({ largura, altura, celular }) {
  if (!celular) {
    const proporcao = largura / Math.max(1, altura)
    const meia = THREE.MathUtils.degToRad(CAMPO_HORIZONTAL_MINIMO) / 2
    const verticalMinimo = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(meia) / proporcao))
    return Math.min(72, Math.max(38, verticalMinimo))
  }
  // No celular o fov sai da PROPORCAO da tela, e nao de um numero fixo.
  //
  // Medido: com fov fixo, na proporcao 0,56 (o aparelho do retorno) cabiam 19
  // de 25 combinacoes de alvo; na proporcao 0,46 cabiam 2, e as duas exigiam
  // fov 70 — lente larga demais. `fov` no three e VERTICAL, entao tela mais
  // estreita perde campo horizontal justamente onde a cena precisa dele.
  // Fixando a cobertura horizontal, cada aparelho recebe o vertical que a
  // proporcao dele pede, e o enquadramento para de depender do modelo.
  const meiaHorizontal = THREE.MathUtils.degToRad(CAMPO_HORIZONTAL) / 2
  const proporcao = Math.max(0.3, largura / Math.max(1, altura))
  const vertical = 2 * Math.atan(Math.tan(meiaHorizontal) / proporcao)
  return THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vertical), 46, 72)
}
