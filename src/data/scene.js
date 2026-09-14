// Geometria da cena em metros. Um lugar so para as medidas, para que
// prateleira, mesa, hotspots e camera nunca saiam de sincronia.
//
// A escala nao e realista de proposito: as pecas de porcelana fria tem de 5 a
// 20 cm de verdade, e nessa escala virariam pontinhos na prateleira. Elas sao
// expostas em PIECE_SCALE para o produto ser o que o olho ve primeiro.

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

export const room = {
  wallZ: -1.6,
  // A parede do fundo e larga de proposito: com a camera aberta, uma parede
  // curta deixava o vazio preto aparecer na beirada do quadro.
  backHalfW: 3.6,
  wallH: 3.5,
  leftWallX: -1.78,
  leftWallSpan: 3.0,
  leftWallCenterZ: -0.3,
  window: { x: 1.46, y: 1.74, w: 0.68, h: 1.05 },
  // Placa na sobra de parede entre a parede da esquerda e a prateleira.
  sign: { x: -1.34, y: 1.62, w: 0.62, h: 0.3 },
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
  z: -1.42,
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

// Presets de camera: [posicao, alvo].
// `mobile` e um enquadramento proprio para tela em pe. Nao da para so afastar
// a camera: em retrato o campo horizontal e menor, e afastar o suficiente para
// caber a prateleira inteira jogaria a cena para longe. Em vez disso, o celular
// recebe um recorte mais apertado e navega pelos pontos.
export const views = {
  home: {
    position: [0.15, 1.58, 3.0],
    target: [-0.05, 1.26, -0.9],
    mobile: { position: [0.05, 1.8, 3.1], target: [0, 1.16, -0.85] },
  },
  mesa: {
    position: [0, 1.32, 1.2],
    target: [0, 0.8, -0.05],
    mobile: { position: [0, 1.46, 1.5], target: [0, 0.82, -0.08] },
  },
  prateleira: {
    position: [0, 1.48, 1.35],
    target: [0, 1.44, -1.4],
    mobile: { position: [0, 1.46, 1.75], target: [0, 1.42, -1.4] },
  },
  orcamento: {
    position: [0.54, 1.34, 1.16],
    target: [0.35, 0.8, 0.06],
    mobile: { position: [0.48, 1.44, 1.34], target: [0.34, 0.8, 0.04] },
  },
  galeria: {
    position: [-0.72, 1.52, 0.72],
    target: [-1.7, 1.5, -0.9],
    mobile: { position: [-0.55, 1.52, 0.95], target: [-1.7, 1.5, -0.88] },
  },
  contato: {
    position: [0.76, 1.3, 0.86],
    target: [0.58, 0.82, -0.3],
    mobile: { position: [0.7, 1.4, 1.02], target: [0.58, 0.82, -0.3] },
  },
}

// Pontos clicaveis na cena. `panel` amarra o ponto ao painel de UI,
// e o mesmo id aparece no menu do topo — cena e menu levam ao mesmo lugar.
export const hotspots = [
  {
    id: 'prateleira',
    title: 'A prateleira',
    label: 'Produtos',
    hint: '11 peças com preço',
    icon: 'shelf',
    panel: 'produtos',
    view: 'prateleira',
    position: [0, 1.76, -1.26],
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
    position: [0.38, 0.94, 0.14],
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
    position: [-1.66, 1.6, -0.9],
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
    position: [0.6, 0.99, -0.32],
    order: 5,
  },
]

// Painel -> ponto da cena. Usado quando o usuario entra pelo menu:
// a camera vai para o lugar certo mesmo sem ele ter clicado na cena.
export const panelToHotspot = hotspots.reduce((acc, h) => {
  acc[h.panel] = h
  return acc
}, {})
