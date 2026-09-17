// Geometria da cena em metros. Um lugar so para as medidas, para que
// prateleira, mesa, plantas, hotspots e camera nunca saiam de sincronia.
//
// A escala das PECAS nao e realista de proposito: as de porcelana fria tem de
// 5 a 20 cm de verdade, e nessa escala virariam pontinhos na prateleira. Elas
// sao expostas em PIECE_SCALE para o produto ser o que o olho ve primeiro.
// O AMBIENTE, ao contrario, e em escala de verdade — parede de 2,9 m, bancada
// de 78 cm, vaso de 25 cm. E o que da a referencia de tamanho para tudo.

import { products } from './products'
import { proto } from '../proto/bandeiras'

export const PIECE_SCALE = 1.45

// Altura util de cada tipo de peca, em unidades de peca (antes de PIECE_SCALE).
// Serve para a camera enquadrar uma lembrancinha de 6 cm e um vaso de 19 cm
// com o mesmo criterio, em vez de usar uma distancia fixa que serve para um so.
export const PIECE_HEIGHT = {
  vaso: 0.192,
  arranjo: 0.16,
  caneca: 0.096,
  prato: 0.2, // exposto em pe, entao o que conta e o diametro
  portajoias: 0.062,
  topo: 0.108,
  numero: 0.126,
  lembrancinha: 0.076,
  ima: 0.055,
  figura: 0.122,
}

/** Altura da peca no mundo, ja com as escalas aplicadas. */
export const pieceWorldHeight = (piece) =>
  (PIECE_HEIGHT[piece.kind] ?? 0.12) * PIECE_SCALE * (piece.scale ?? 1)

// O ateliê e um comodo de tres paredes. A da frente nao existe — e por ali que
// a camera olha — e a da direita e um retorno curto: fecha o canto quando o
// visitante gira para aquele lado sem virar parede cega na frente da cena.
//
// Parede e caixa, nao plano: com espessura a quina da abertura aparece, o
// rodape tem onde encostar e o comodo para de parecer papel dobrado.
export const room = {
  wallZ: -1.7, // face interna da parede do fundo
  halfW: 1.92, // faces internas das laterais, em -halfW e +halfW
  // ?teto= na URL. Sem parametro isto e 2.9, identico ao publicado. O teto
  // sobe sozinho com a parede, e a sanca e os postes da viga derivam dele.
  // Medido: subir o teto NAO melhora a navegacao — a colisao da camera e
  // contra as PAREDES, e a distancia apos colisao e identica em 2,9, 3,05 e
  // 3,2 em todos os azimutes. O que ele muda e a composicao da primeira tela.
  wallH: proto.teto,
  wallT: 0.1,
  leftFrontZ: 1.75, // ate onde a parede da esquerda avanca
  // O retorno da direita para aqui. Nas variantes de navegacao ele vai ate
  // 0,85, e o numero saiu de varredura, nao de gosto: com traçado de raios em
  // seis telas, o vazio de fora do comodo no pior caso do trilho e 17,6% da
  // tela em 812x375 com o retorno em 0,4, e 0,00% com 0,85 — em todas as
  // telas, sem precisar apertar a lente. A navegacao de hoje, para comparar,
  // chega a 36,5% no pior angulo do celular.
  // Custo: zero triangulo e zero draw call (a parede e uma caixa so, e o
  // rodape e a profundidade do teto ja derivam desta medida). Conferido que a
  // IMPORTANTE: quem decide e `proto.ligado`, e nao a variante. Com ?nav=atual
  // o controle recebe a MESMA sala das variantes, senao o teste compararia
  // navegacao e geometria ao mesmo tempo — e so a parede estendida ja muda 20
  // pontos de vazio em 1440. Sem parametro nenhum, 0,1: o site publicado.
  // samambaia do banquinho nao fura a parede nova: o vertice mais a direita
  // dela fica em x 1,822, com 9,8 cm de folga da face interna.
  rightFrontZ: proto.ligado ? 0.85 : 0.1,
  floorFrontZ: 2.7, // o assoalho avanca um pouco mais que as paredes
  window: { x: 1.34, y: 1.72, w: 0.7, h: 1.12 },
  // Placa na sobra de parede entre a parede da esquerda e a prateleira.
  sign: { x: -1.4, y: 2.16, w: 0.66, h: 0.32 },
  // Viga aparente no teto: e dela que as plantas penduram.
  beam: { y: 2.62, z: -0.55, h: 0.16, d: 0.12 },
}

export const table = {
  topY: 0.78,
  halfW: 1.1,
  halfD: 0.52,
  thickness: 0.06,
}

// shelf 0 = mais alta. Cada nivel e uma tabua na parede do fundo.
// O vao entre niveis (0.48) tem de caber a peca mais alta ja escalada.
export const shelf = {
  z: -1.55,
  depth: 0.28,
  halfW: 0.92,
  thickness: 0.045,
  levels: [1.92, 1.44, 0.96],
  // Cinco vagas por nivel: produtos e pecas de cenario se alternam nelas.
  slotsX: [-0.68, -0.34, 0, 0.34, 0.68],
}

export const shelfSlotPosition = (slot) => [
  shelf.slotsX[slot.x],
  shelf.levels[slot.shelf] + shelf.thickness / 2,
  shelf.z,
]

// --- plantas --------------------------------------------------------------
// O ateliê e cheio de planta de proposito: e o que tira a cena do "quarto
// vazio com uma estante", o que da leitura de escala e o que enquadra o
// primeiro plano. Ficam nos quatro lugares onde planta fica na vida real —
// chao, parede, prateleira e pendurada na viga.
//
// Duas regras de posicao, as duas por causa da camera:
// 1. folhagem nao fura parede: nenhum vertice de folha ou haste passa das
//    faces internas (±room.halfW onde ha parede lateral, room.wallZ no fundo);
//    a hera encosta na parede, nao atravessa;
// 2. nada pendurado no corredor entre a camera da vista `prateleira`
//    e a estante (|x| < 0.55), senao a planta tapa o produto.
export const plants = [
  // chao
  { id: 'costela-frente', kind: 'costela', position: [-1.15, 0, 1.35], rotation: [0, 0.6, 0], scale: 1.15, seed: 3 },
  // Movida, aumentada e agora LEVANTADA, depois da revisao do celular.
  // Mover de lado nao resolveu, e a conta explica por que nao ia resolver: a
  // visada da camera do celular ([1.9, 1.62, 2.4]) ate aqui cruza a borda de
  // tras do tampo (z -0.52) em x -0.76 — DENTRO da largura da mesa (+-1.1),
  // mesmo a planta estando fora dela. Para a folhagem limpar o tampo (0.78) ela
  // precisa comecar acima de ~0.52. A alavanca e altura, nao lado.
  // y = stand.h * scale, como na samambaia: o banquinho e montado do tampo
  // (y 0 local) para baixo ate -h, e o grupo ainda aplica a escala.
  { id: 'costela-fundo', kind: 'costela', position: [-1.58, 0.391, -1.42], rotation: [0, -0.7, 0], scale: 0.85, seed: 17, stand: { h: 0.46, r: 0.15 } },
  // x 1.44: em 1.5 a folha mais aberta furava o retorno da parede direita
  // (2,9 cm) quando o vento chegava na amplitude maxima.
  { id: 'espada-janela', kind: 'espada', position: [1.44, 0, -1.05], rotation: [0, -0.4, 0], scale: 1.05, seed: 8 },
  {
    id: 'samambaia-banquinho',
    kind: 'samambaia',
    // y = stand.h * scale: a altura do banquinho e montada no espaco local e
    // o grupo ainda aplica a escala, entao 0.46 deixava os pes no ar.
    position: [1.55, 0.414, 0.72],
    rotation: [0, 0.9, 0],
    scale: 0.9,
    seed: 23,
    stand: { h: 0.46, r: 0.15 },
  },

  // parede: hera subindo nas duas laterais e dois vasos em suporte de ferro
  // x na face da parede (±1.918): a haste nasce 1,2 cm para fora do grupo,
  // entao em 1.9 a hera ficava 3 cm descolada.
  { id: 'hera-direita', kind: 'hera', position: [1.918, 0.52, -0.8], rotation: [0, -Math.PI / 2, 0], scale: 0.85, seed: 5 },
  { id: 'hera-esquerda', kind: 'hera', position: [-1.918, 0.58, 0.55], rotation: [0, Math.PI / 2, 0], scale: 0.78, seed: 31 },
  // `bracket` traz as medidas do suporte: alcance do braco ate a parede e raio
  // do aro no vaso desta planta (em unidades locais, antes da escala).
  { id: 'suporte-jiboia', kind: 'jiboia', position: [-1.46, 1.78, -1.62], rotation: [0, 0.3, 0], scale: 0.6, seed: 12, bracket: { comp: 0.137 } },
  { id: 'suporte-suculenta', kind: 'suculenta', position: [-1.74, 1.3, -1.62], rotation: [0, -0.4, 0], scale: 1.4, seed: 44, bracket: { r: 0.037, alt: 0.028, comp: 0.058 } },

  // prateleira: nas pontas das tabuas, fora das vagas de produto
  { id: 'jiboia-prateleira', kind: 'jiboia', position: [-0.86, 1.9425, -1.5], rotation: [0, 0.4, 0], scale: 0.6, seed: 9, frente: true },
  { id: 'suculenta-prateleira', kind: 'suculenta', position: [0.68, 1.4625, -1.5], rotation: [0, 1.1, 0], scale: 1.15, seed: 21 },
  { id: 'cacto-prateleira', kind: 'cacto', position: [0.68, 0.9825, -1.5], rotation: [0, -0.6, 0], scale: 1.05, seed: 6 },

  // bancada
  { id: 'suculenta-mesa', kind: 'suculenta', position: [1.0, 0.78, -0.08], rotation: [0, 0.3, 0], scale: 1.3, seed: 15 },

  // penduradas na viga, todas fora do corredor de visao da estante
  { id: 'pendurada-samambaia', kind: 'samambaia', position: [1.12, 2.54, -0.55], rotation: [0, 0.3, 0], scale: 0.85, seed: 2, hanging: 0.5 },
  // A da esquerda fica perto da ponta da viga e com corda curta. Em x -1.05,
  // vista da camera `home`, os ramos cobriam 43% da placa com o nome do
  // ateliê. Aqui a placa fica livre e o mural nao passa de 3% coberto.
  { id: 'pendurada-jiboia', kind: 'jiboia', position: [-1.38, 2.54, -0.55], rotation: [0, -0.7, 0], scale: 0.8, seed: 27, hanging: 0.22 },
  { id: 'pendurada-jiboia-2', kind: 'jiboia', position: [1.62, 2.54, -0.55], rotation: [0, 1.6, 0], scale: 0.7, seed: 36, hanging: 0.66 },
]

// Quadros e porta-retratos. Ficam AQUI, e nao dentro do componente, porque o
// CameraRig precisa deles para calcular o enquadramento de quem clica num
// quadro — e rig importando de componente seria dependencia ao contrario.
//
// `prop` e a proporcao da foto: a da bancada e 4:5 e as de familia sao
// quadradas. Sem isso a moldura assumiria 4:5 para todas e esticaria as outras.
const FRENTE_PAREDE = 0.012 // 12 mm a frente da face interna, para a moldura ter ar

export const quadros = [
  // Coluna entre a placa e a estante, na parede do fundo.
  { id: 'q1', foto: '/fotos/retrato-04.jpg', prop: 0.8, pos: [-1.18, 1.74, -1.7 + FRENTE_PAREDE], gira: 0, w: 0.23, inclina: 0.012 },
  { id: 'q2', foto: '/fotos/retrato-01.jpg', prop: 1, pos: [-1.18, 1.44, -1.7 + FRENTE_PAREDE], gira: 0, w: 0.21, inclina: -0.01 },
  { id: 'q3', foto: '/fotos/retrato-03.jpg', prop: 1, pos: [-1.18, 1.14, -1.7 + FRENTE_PAREDE], gira: 0, w: 0.21, inclina: 0.008 },
  // Retorno da direita, em diptico. Repetem duas da coluna — sao tres fotos
  // para mais de tres lugares —, mas este lado so aparece para quem gira para
  // ca, entao a repeticao nunca cai no mesmo quadro que a coluna.
  { id: 'q4', foto: '/fotos/retrato-01.jpg', prop: 1, pos: [1.92 - FRENTE_PAREDE, 1.46, -1.5], gira: -Math.PI / 2, w: 0.21, inclina: -0.008 },
  { id: 'q5', foto: '/fotos/retrato-03.jpg', prop: 1, pos: [1.92 - FRENTE_PAREDE, 1.46, -1.18], gira: -Math.PI / 2, w: 0.21, inclina: 0.008 },
]

export const retratos = [
  { id: 'r1', foto: '/fotos/retrato-04.jpg', pos: [1.31, 1.17, -1.6], gira: -0.34, w: 0.15, prop: 0.8 },
  { id: 'r2', foto: '/fotos/retrato-01.jpg', pos: [-0.86, 0.9825, -1.5], gira: 0.42, w: 0.14, prop: 1 },
  { id: 'r3', foto: '/fotos/retrato-03.jpg', pos: [0.63, 0.78, 0.31], gira: -0.22, w: 0.115, prop: 1 },
]

/**
 * De onde olhar um quadro de perto.
 * A moldura olha para +z no espaco local dela, girada por `gira` em Y — entao a
 * normal e (sin, 0, cos). A camera vai nessa direcao, na altura do quadro.
 */
export const quadroFraming = (quadro, mobile) => {
  // Distancia proporcional a LARGURA, e nao fixa: a mesma distancia que
  // enquadra um quadro de 23 cm deixaria um porta-retrato de 11,5 cm pequeno no
  // meio da tela. Assim todos ocupam mais ou menos o mesmo pedaco do quadro.
  const d = (mobile ? 2.9 : 2.5) * quadro.w
  const nx = Math.sin(quadro.gira)
  const nz = Math.cos(quadro.gira)
  const [x, y, z] = quadro.pos
  return {
    position: [x + nx * d, y, z + nz * d],
    target: [x, y, z],
  }
}

// Presets de camera: [posicao, alvo].
// `mobile` e um enquadramento proprio para tela em pe. Nao da para so afastar
// a camera: em retrato o campo horizontal e menor, e afastar o suficiente para
// caber a prateleira inteira jogaria a cena para longe. Em vez disso, o celular
// recebe um recorte mais apertado e navega pelos pontos.
export const views = {
  home: {
    position: [0.22, 1.66, 2.5],
    target: [0, 1.22, -0.95],
    // Enquadramento pedido na revisao do celular, reproduzido a partir de um
    // print: a abertura anterior chegava fechada na estante e o mural dos
    // projetos ficava FORA de quadro — "os projetos nao estao aparecendo, tinha
    // que aparecer quando o site inicia". Daqui entram na mesma tela o mural
    // inteiro, a placa, as tres tabuas, a bancada, a viga em cima e o assoalho
    // embaixo. Cabe nos limites que ja existiam: distancia 4,79 (teto 4,9),
    // azimute 0,68 rad (limite 1,2) e alvo dentro de `targetBounds`.
    mobile: { position: [1.9, 1.62, 2.4], target: [-1.15, 1.08, -1.28] },
  },
  mesa: {
    position: [0.05, 1.42, 1.22],
    target: [0, 0.8, -0.06],
    mobile: { position: [0, 1.52, 1.56], target: [0, 0.82, -0.08] },
  },
  // A vista que vende. No desktop (16:10) a distancia e a menor em que as tres
  // tabuas e as etiquetas de cima ficam abaixo do menu; mais perto, a tabua de
  // cima some atras dele. Em retrato a conta e pela LARGURA: as cinco colunas
  // de peca precisam caber, o que empurra a camera para perto da frente.
  prateleira: {
    position: [0, 1.62, 1.09],
    target: [0, 1.6, -1.52],
    mobile: { position: [0, 1.6, 2.05], target: [0, 1.58, -1.52] },
  },
  orcamento: {
    position: [0.52, 1.22, 0.98],
    target: [0.38, 0.8, 0.1],
    mobile: { position: [0.46, 1.34, 1.2], target: [0.36, 0.8, 0.08] },
  },
  galeria: {
    position: [-0.6, 1.56, 0.1],
    target: [-1.82, 1.5, -0.9],
    mobile: { position: [-0.42, 1.56, 0.36], target: [-1.82, 1.5, -0.88] },
  },
  contato: {
    position: [0.74, 1.16, 0.64],
    target: [0.6, 0.82, -0.3],
    mobile: { position: [0.7, 1.26, 0.82], target: [0.6, 0.82, -0.3] },
  },
}

// Limites da orbita. Ficam aqui, e nao dentro do CameraRig, porque sao
// geometria: dependem de onde estao as paredes e de onde esta o assoalho.
export const orbit = {
  minDistance: 0.45,
  maxDistance: 4.9,
  minPolarAngle: 0.22,
  // Teto do angulo vertical. 2.05 rad (117 graus) passa bastante da
  // horizontal, o que e o que permite olhar para cima e ver as plantas
  // penduradas na viga. Este valor vale de perto: no CameraRig ele e
  // reapertado a cada quadro em funcao da distancia, senao o mesmo angulo que
  // e confortavel a 1 m enterraria a camera no chao a 4,9 m.
  maxPolarAngle: 2.05,
  // Nas pontas deste giro a camera, de longe, iria parar atras das paredes
  // laterais. Elas sao colisores (CameraRig): a camera se aproxima do alvo em
  // vez de atravessar.
  minAzimuthAngle: -1.2,
  maxAzimuthAngle: 1.2,
  // Altura minima da camera. O assoalho nao tem face de baixo: se a camera
  // passar dele, a cena desaparece.
  cameraMinY: 0.32,
  // Altura maxima. O teto e um plano de uma face so, que some visto de cima, e
  // acima dele o comodo vira casa de bonecas aberta, com o vazio em volta.
  // Fica abaixo das plantas penduradas na viga.
  cameraMaxY: 2.45,
  // Caixa em que o ALVO da camera pode andar: dentro do comodo, sem encostar
  // na parede. So o alvo e preso — a camera continua podendo se afastar pela
  // frente aberta, que e de onde o diorama se ve. A caixa precisa CONTER o
  // alvo de todo preset (galeria em x -1.82, prateleira e pecas em z -1.53):
  // alvo que comeca fora dela e jogado para dentro no primeiro pixel de pan.
  targetBounds: {
    min: [-1.85, 0.42, -1.56],
    max: [1.5, 2.3, 0.95],
  },
}

// --- gato -----------------------------------------------------------------
// Onde fica o arranhador. A escolha saiu de medicao com marcador, nao de gosto:
//
//  - um marcador de 24 cm (gato deitado no chao) NAO entra no quadro de
//    abertura em nenhuma das duas larguras — em 1440 nenhum dos seis candidatos
//    aparecia, e em 375 so lascas de borda. O assoalho quase nao se ve daqui;
//  - o MESMO ponto com 70 cm entra nas duas. Como na costela do fundo, o que
//    decide nesta cena e a altura, nao o lugar;
//  - o candidato colado no mural ([-1.55, 0, -0.9]) passava em todos os
//    numeros e foi reprovado OLHANDO: o poste caia em cima da folhagem da planta
//    que eu tinha acabado de levantar, e ainda por cima embaixo do marcador
//    `galeria` ([-1.74, 1.6, -0.9]), no canto mais carregado do quadro;
//  - com o poste alto (ver Cat.jsx), em [-1.15, 0, -0.85] o abajur vermelho da
//    bancada ficava NA FRENTE do corpo do gato no desktop. Cada ALTURA trocava
//    uma oclusao por outra, entao a alavanca passou a ser o LADO: empurrado
//    0.22 para +x, ele sai de tras da cupula no desktop e se afasta do circulo do
//    marcador "Como e feito" no celular. Conferido olhando nas duas larguras, e
//    comparado com um empurrao para +x e para tras, que fazia o mesmo mas
//    puxava o poste para perto do corredor da vista `prateleira`;
//  - x -0.93 cai DENTRO da largura da bancada (halfW 1.1), mas ATRAS dela: a
//    base do poste termina em z -0.68, 16 cm atras da borda de tras do tampo
//    (-0.52), e a volta do gato (raio 0.24) chega a -0.61, ainda atras. Fica a
//    0.86 m da `costela-fundo`.
export const gato = {
  arranhador: [-0.93, 0, -0.85],
  giro: 0.55,
}

// Pontos clicaveis na cena. `panel` amarra o ponto ao painel de UI,
// e o mesmo id aparece no menu do topo — cena e menu levam ao mesmo lugar.
export const hotspots = [
  {
    id: 'prateleira',
    title: 'A prateleira',
    label: 'Produtos',
    // Contado do catalogo, como o subtitulo do painel de Produtos: digitado, o
    // "11" ficaria errado no primeiro produto que entrasse ou saisse.
    hint: `${products.length} peças com preço`,
    icon: 'shelf',
    panel: 'produtos',
    view: 'prateleira',
    position: [0, 1.74, -1.38],
    order: 1,
  },
  {
    id: 'orcamento',
    title: 'O caderno de pedidos',
    label: 'Orçamento',
    hint: 'Peça o seu em 1 minuto',
    icon: 'notebook',
    panel: 'orcamento',
    view: 'orcamento',
    // x 0.28 (era 0.38), junto com o Contato em x 0.55 (era 0.6). Na visao
    // geral o rotulo do "Contato" encostava no circulo deste marcador a partir de
    // ~760 px de altura: 8 px2 em 1536x730, 155 em 1366x657, 267 em 1440x600 (so
    // as partes pintadas); e no celular em pe o rotulo do Contato passava 2 a 7 px
    // da borda direita. Medido movendo as ancoras em tempo de execucao e depois com
    // o codigo real, em 16 telas de 360x640 a 1440x900: zero sobreposicao, nenhum
    // marcador sob o card, Contato dentro da tela em todos os celulares.
    // Custo: no close do caderno (passo 2 do tour) o circulo fica sobre o copo de
    // pinceis. Reprovadas: so o Contato a esquerda refazia a colisao nos notebooks;
    // descer esta ancora a jogava sob o card em 360x640; avancar em z sem descer
    // refazia a colisao; subir o Contato o levava para cima da tabua no close do
    // telefone.
    position: [0.28, 0.94, 0.14],
    order: 2,
  },
  {
    id: 'galeria',
    title: 'O mural de fotos',
    label: 'Projetos',
    hint: 'O que já saiu daqui',
    icon: 'photos',
    panel: 'galeria',
    view: 'galeria',
    position: [-1.74, 1.6, -0.9],
    order: 3,
  },
  {
    id: 'mesa',
    title: 'A bancada',
    label: 'Como é feito',
    hint: 'Da massa à peça pronta',
    icon: 'hands',
    panel: 'processo',
    view: 'mesa',
    position: [-0.3, 1.06, 0.18],
    order: 4,
  },
  {
    id: 'contato',
    title: 'O telefone do ateliê',
    label: 'Contato',
    hint: 'Falar com a Isabela',
    icon: 'phone',
    panel: 'contato',
    view: 'contato',
    // x 0.55 (era 0.6): ver o comentario do marcador de orcamento.
    position: [0.55, 0.99, -0.32],
    order: 5,
  },
]

// Painel -> ponto da cena. Usado quando o usuario entra pelo menu:
// a camera vai para o lugar certo mesmo sem ele ter clicado na cena.
export const panelToHotspot = hotspots.reduce((acc, h) => {
  acc[h.panel] = h
  return acc
}, {})
