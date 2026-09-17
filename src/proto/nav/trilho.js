// Protótipo (b): TRILHO.
//
// Arrastar deixa de girar e passa a ANDAR. A camera percorre um arco de 3,14 m
// dentro da frente do comodo, de x -1,15 a x +1,15, e o ponto para onde ela
// olha desliza junto e para FORA: na ponta esquerda o olhar para no mural, na
// direita na face do retorno, onde esta o diptico. Os dois raios das pontas
// DIVERGEM — o oposto de hoje, em que convergem num ponto a 4,81 m no canto do
// fundo e a colisao com a parede encurta o raio para 0,82 m, que e o que se
// sente como "girar no proprio eixo".
//
// Na tela a bancada (z 0) anda 1,6x mais rapido que a prateleira (z -1,55): e
// essa diferenca que o olho le como caminhar em vez de rodar uma mesa.
//
// Este modulo nao importa NADA — nem three, nem drei. So numero entra e sai.
// E o que impede o empacotador de mover o three para um pedaco compartilhado e
// partir o caminho padrao em duas requisicoes.

// --- a curva da camera, em planta: arco de elipse ---
const AX = 1.18 // semi-eixo em x
const AZ = 1.16 // semi-eixo em z
const CZ = 0.44 // centro da elipse em z
const FI = 1.34 // meia-varredura, em radianos

// --- a curva do alvo: o olhar gira para FORA e a distancia encolhe nas pontas ---
const PSI = 0.42 // giro do olhar na ponta, em radianos
const L_CENTRO = 2.5
const L_PONTA = 1.9

// --- altura: tres valores interpolados por v ---
const CAM_Y = [1.12, 1.55, 2.02]
const ALVO_Y = [1.7, 1.24, 1.12]

// --- pinca: quanto a camera avanca na direcao do alvo. 1 = em cima do trilho ---
const K_MIN = 0.68
const K_MAX = 1.15

// Ganhos do arrasto, divididos pela MENOR dimensao da tela: sem isso o celular
// deitado ficaria 2x mais rapido que em pe. O vertical vale 47% do horizontal,
// a mesma proporcao que o projeto ja escolheu entre polarRotateSpeed e
// azimuthRotateSpeed no toque, e pelo mesmo motivo: a sala anda em volta e o
// horizonte fica quieto.
const GANHO_S = { toque: 0.95, ponteiro: 1.4 }
const GANHO_V = { toque: 0.45, ponteiro: 1.05 }

// Inercia ao soltar.
const MEIA_VIDA = 0.16
const VEL_MAX = 4
const VEL_PARADA = 0.05

// Quanto de trilho a camera leva para sair da pose do preset e entrar no
// trilho. Com movimento reduzido isso encurta: nao pode virar um deslize de
// 1,5 m que ninguem pediu.
const ENTRADA = 0.36
const ENTRADA_REDUZIDA = 0.1

const travar = (v, min, max) => (v < min ? min : v > max ? max : v)

/** Interpola uma tabela de tres valores por v em [-1, 1]. */
const porAltura = (tabela, v) =>
  v <= 0 ? tabela[1] + (tabela[0] - tabela[1]) * -v : tabela[1] + (tabela[2] - tabela[1]) * v

/** A inversa da tabela acima: de uma altura de camera para o v equivalente. */
const alturaParaV = (y) => {
  if (y <= CAM_Y[1]) return -travar((CAM_Y[1] - y) / (CAM_Y[1] - CAM_Y[0]), 0, 1)
  return travar((y - CAM_Y[1]) / (CAM_Y[2] - CAM_Y[1]), 0, 1)
}

const poseNoTrilho = (s, v, k) => {
  const rx = AX * Math.sin(FI * s)
  const rz = CZ + AZ * Math.cos(FI * s)
  const psi = PSI * s
  const L = L_CENTRO + (L_PONTA - L_CENTRO) * Math.abs(s)
  const ax = rx + L * Math.sin(psi)
  const az = rz - L * Math.cos(psi)
  // A pinca desliza a camera na horizontal em direcao ao alvo. Afastar alem do
  // trilho nao faz nada: o trilho E a parede de tras do passeio.
  return {
    pos: [ax + (rx - ax) * k, porAltura(CAM_Y, v), az + (rz - az) * k],
    alvo: [ax, porAltura(ALVO_Y, v), az],
  }
}

export default function criarTrilho({ toque, reduzido }) {
  const ganhoS = toque ? GANHO_S.toque : GANHO_S.ponteiro
  const ganhoV = toque ? GANHO_V.toque : GANHO_V.ponteiro
  const entrada = reduzido ? ENTRADA_REDUZIDA : ENTRADA

  return {
    nome: 'trilho',
    // A variante comanda o enquadramento inteiro, entao o giro e o pan da
    // biblioteca saem de cena.
    gestosProprios: true,
    // Nas pontas o alvo do trilho fica EM CIMA da parede, e os quatro raios que
    // o camera-controls lanca do alvo ate a camera devolvem corte 0,00 m: a
    // camera colapsaria no alvo — exatamente o defeito que este protótipo
    // existe para consertar. Por isso, no trilho, sem colisores.
    colisores: false,
    // O retorno da direita termina em z 0,10 e o trilho leva o olhar ate a face
    // dele. Sem isto, medido, o vazio chega a 15% da tela em 1440 e 29% no
    // celular deitado.
    sala: { rightFrontZ: 0.4 },

    /** De onde a pose atual entra no trilho (inversa exata da elipse). */
    inicial: ({ pos }) => ({
      s: travar(Math.atan2(pos[0] / AX, (pos[2] - CZ) / AZ) / FI, -1, 1),
      v: alturaParaV(pos[1]),
      k: 1,
      vel: 0,
      mistura: 0,
    }),

    arrastar: (e, { dx, dy, menor }) => ({
      ...e,
      s: travar(e.s - (ganhoS * dx) / menor, -1, 1),
      v: travar(e.v + (ganhoV * dy) / menor, -1, 1),
      vel: 0,
    }),

    pincar: (e, fator) => ({ ...e, k: travar(e.k / fator, K_MIN, K_MAX) }),

    soltar: (e, velocidade) => ({
      ...e,
      vel: reduzido ? 0 : travar(velocidade, -VEL_MAX, VEL_MAX),
    }),

    quadro: (e, dt, tempo) => {
      let { s, v, k, vel, mistura } = e
      // Inercia: um peteleco forte acrescenta no maximo 0,64 de s (1,0 m) e
      // assenta em ~0,65 s. Bater na ponta para, sem quicar.
      if (Math.abs(vel) > VEL_PARADA) {
        s = travar(s + vel * dt, -1, 1)
        if (s === -1 || s === 1) vel = 0
        else vel *= Math.exp(-dt / MEIA_VIDA)
      } else {
        vel = 0
      }
      // A entrada no trilho: a pose desenhada vai da pose congelada ate a do
      // trilho ao longo de `entrada` de trilho andado.
      mistura = travar(mistura + Math.abs(s - e.s) / entrada + dt * 0.6, 0, 1)

      // Respiro: nos proprios parametros, e como SENO ABSOLUTO, nao integrado.
      // Sendo absoluto ele nao acumula deriva ao encostar nas travas, defeito
      // que a versao integrada teria.
      const respiroS = reduzido ? 0 : 0.05 * Math.sin(tempo * 0.24)
      const respiroV = reduzido ? 0 : 0.037 * Math.sin(tempo * 0.19)

      return {
        estado: { s, v, k, vel, mistura },
        pose: poseNoTrilho(travar(s + respiroS, -1, 1), travar(v + respiroV, -1, 1), k),
        mistura,
        vivo: Math.abs(vel) > VEL_PARADA || mistura < 1,
      }
    },

    /** Onde a camera esta, em palavra, para o chip da tela. */
    lugar: (e) => (e.s <= -0.45 ? 'O lado do mural' : e.s >= 0.45 ? 'O lado da janela' : 'Visão geral'),
  }
}
