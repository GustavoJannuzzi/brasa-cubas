import { room } from '../../data/scene'

// Protótipo (a): ÓRBITA PELO CENTRO, COM CORTE.
//
// Arrastar gira o ateliê como uma maquete numa banqueta: a camera anda em volta
// do comodo a distancia constante, e a parede que fica entre voce e a cena se
// apaga enquanto voce passa por tras dela.
//
// Diferente dos outros dois, este NAO toma os gestos para si: quem gira
// continua sendo o camera-controls, porque a orbita e exatamente o que ele faz
// bem. O que muda sao tres coisas: o PIVO (que passa a ser o centro do comodo,
// e nao um canto), o LIMITE do giro (que passa a ser a parede do fundo, a unica
// que nao pode sumir porque e ela que faz o sol) e o CORTE das laterais.
//
// Importa `scene.js` (dado), nunca three nem drei.

// O pivô: 5 cm do alvo que a visao geral do desktop ja usa. Fica na linha de
// centro, entre a bancada e a tabua de cima, e no z do mural — que e o que
// enquadra as duas laterais de perfil quando se gira 90 graus.
const CENTRO = [0, 1.28, -0.9]

// A camera nao pode ir para tras da parede do fundo: e a unica que nao e
// cortavel, porque e ela que tem a janela por onde entra o sol. 15 cm a frente
// da face interna.
const Z_MINIMO = room.wallZ + 0.15

// Ate onde a camera pode se afastar de lado. Aqui sair do casco e o PONTO: a
// cena vira maquete e a parede da frente some. O limite existe so para o ultimo
// grau do giro, em que o quadro passava a mostrar 15,1% de vazio com a camera
// em x 3,34. Generoso de proposito — apertar isto encurta a volta, que e o que
// esta variante existe para oferecer.
const X_MAXIMO = 4.2

// Distancia maxima. Medido: com a abertura de 32 graus do celular, o comodo
// inteiro so cabe no quadro a partir de ~6,2 m com o alvo no centro. A neblina
// a 6,6 m come 6,8% e dissolve a borda do diorama sem apagar a cena.
const DISTANCIA_MAX = 6.6

// Quanto tempo a parede leva para sumir por completo. O teto de velocidade e o
// que torna "piscar" impossivel por construcao.
const TEMPO_CORTE = 0.3

const travar = (v, min, max) => (v < min ? min : v > max ? max : v)

export default function criarOrbita({ toque }) {
  return {
    nome: 'orbita',
    // A biblioteca continua comandando o gesto.
    gestosProprios: false,
    // SEM colisor, e esta e a decisao central da variante: o colisor encurta o
    // raio contra a parede (medido: de 3,77 m para 2,42 m no giro de 87 graus),
    // que e exatamente o "girar no lugar" que se quer consertar — e, pior, a
    // camera nunca chega atras da parede, que e onde o corte acontece. Quem
    // protege a parede do fundo, a unica que nao pode sumir, e o limite de
    // azimute em z.
    colisores: false,

    controles: {
      azimuthRotateSpeed: toque ? 0.75 : 0.9,
      polarRotateSpeed: toque ? 0.26 : 0.75,
      maxDistance: DISTANCIA_MAX,
      // O pan de dois dedos e justamente o que arrancaria o pivô do centro do
      // comodo e devolveria o defeito de hoje. So a pinca fica.
      semTruckDeDoisDedos: true,
      // Os limites de hoje (+-1,2 rad) saem: quem limita agora e a conta por
      // quadro contra a parede do fundo.
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
    },

    /**
     * No primeiro arrasto, o alvo anda SOBRE O RAIO DE VISADA ate o ponto mais
     * perto do centro do comodo: mesma posicao, mesma direcao, imagem
     * identica — so o pivô muda. Trocar o alvo de qualquer outro jeito giraria
     * a imagem na cara da pessoa.
     */
    reancorar: ({ pos, alvo }) => {
      const ux = alvo[0] - pos[0]
      const uy = alvo[1] - pos[1]
      const uz = alvo[2] - pos[2]
      const n = Math.hypot(ux, uy, uz) || 1
      const dx = ux / n
      const dy = uy / n
      const dz = uz / n
      const t = (CENTRO[0] - pos[0]) * dx + (CENTRO[1] - pos[1]) * dy + (CENTRO[2] - pos[2]) * dz
      // A vista da galeria olha para FORA do centro: ali re-ancorar poria o pivô
      // atras da camera. Fica como close, com o botao de casa como saida.
      if (t < 0.6) return null
      return [pos[0] + dx * t, pos[1] + dy * t, pos[2] + dz * t]
    },

    /**
     * Ate onde o giro pode ir. Sao DUAS desigualdades, e a segunda faltava:
     *
     * 1. em z, a camera nao passa para tras da parede do fundo — e a unica que
     *    nao pode sumir, porque e ela que tem a janela por onde entra o sol;
     * 2. em x, a camera nao se afasta demais do casco. Sem isto, medido, no
     *    ultimo grau do giro ela ia parar em x 3,34 e o vazio saltava de 0,0%
     *    para 15,1% do quadro.
     */
    azimuteMaximo: ({ alvo, dist, phi }) => {
      const denominador = dist * Math.sin(phi)
      if (denominador < 0.001) return Math.PI
      const porZ = Math.acos(travar((Z_MINIMO - alvo[2]) / denominador, -0.999, 0.999))
      const porX = Math.asin(travar((X_MAXIMO - Math.abs(alvo[0])) / denominador, -0.999, 0.999))
      return Math.min(porZ, Math.abs(porX))
    },

    /**
     * Qual parede fica entre a pessoa e a cena. O criterio e de que lado da
     * FACE INTERNA a camera esta — e uma prova, nao uma medicao: o miolo do
     * comodo fica inteiro de um lado do plano, entao uma parede so pode tapar o
     * miolo vista do outro lado.
     */
    // A troca acontece depois da ESPESSURA da parede, e nao na face interna: e
    // dentro desses 10 cm que a camera esta dentro do solido e nao se ve nada,
    // entao o estado intermediario nao e observavel. Na face interna, medido, a
    // abertura do celular ficava a 0,4 grau da troca — um pixel de dedo apagava
    // a parede inteira.
    corte: (cam) => ({
      esq: cam[0] < -(room.halfW + room.wallT),
      dir: cam[0] > room.halfW + room.wallT,
    }),

    tempoDeCorte: TEMPO_CORTE,

    lugar: () => 'Rodeando o ateliê',
  }
}
