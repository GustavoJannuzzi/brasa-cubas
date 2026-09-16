import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Gerador de pecas de porcelana fria. Nao existe modelo externo: cada peca e
// montada a partir de primitivas e de perfis de revolucao (lathe).
//
// Tudo o que uma peca gera cai em um de cinco grupos de material
// (massa, pintura, petala, folha, miolo da flor). No fim, cada grupo e mesclado
// em uma unica geometria -> 5 draw calls por peca em vez de uma centena.

// --- niveis de detalhe ------------------------------------------------------
// Uma esfera 16x12 tem 352 triangulos, e ela era clonada para CADA petala,
// miolo e folha: as 19 pecas somavam 206 mil triangulos, 81% deles em petala,
// iguais no celular. Na prateleira do desktop a petala ocupa de 18 a 30 px e
// no celular de 13 a 21 — cerca de 1,4 a 2 px por triangulo, o pior caso para
// GPU de celular: custo de vertice e de rasterizacao por detalhe que nao
// aparece.
//
// Existiu aqui um nivel `foco`, com a subdivisao antiga, para a peca em
// destaque nao facetar no close-up. Comparado na tela, com a camera parada e
// so a malha mudando, ele PIOROU a peca: em 16x12 a petala fica tao lisa que
// as petalas vizinhas se fundem numa bolota, e em 10x7 a aresta poligonal
// separa uma da outra. Faz sentido — menos subdivisao da normais mais
// distintas entre faces vizinhas, e e essa quebra de luz que desenha a dobra
// da petala, que e o que porcelana fria modelada a mao tem. Custava 75 ms
// sincronos e 1,9 MB por peca destacada, entao saiu.
const NIVEIS = {
  alta: { petala: [10, 7], esfera: [16, 12], cilindro: 16, haste: 6, cone: 14, lathe: 24 },
  baixa: { petala: [8, 5], esfera: [12, 8], cilindro: 12, haste: 4, cone: 10, lathe: 16 },
}

const primitivas = new Map()
const conjunto = (nivel) => {
  let p = primitivas.get(nivel)
  if (!p) {
    const n = NIVEIS[nivel] ?? NIVEIS.alta
    p = {
      esfera: new THREE.SphereGeometry(1, n.esfera[0], n.esfera[1]),
      // Petala, miolo e folha sao achatados ate virar lasca (0,0035 de 0,011):
      // a subdivisao que uma esfera precisa simplesmente nao se ve neles.
      petala: new THREE.SphereGeometry(1, n.petala[0], n.petala[1]),
      cilindro: new THREE.CylinderGeometry(1, 1, 1, n.cilindro),
      // Haste aberta: e um palito de 2 mm plantado no vaso, e as duas tampas
      // ficavam enterradas.
      haste: new THREE.CylinderGeometry(1, 1, 1, n.haste, 1, true),
      cone: new THREE.ConeGeometry(1, 1, n.cone),
      caixa: new THREE.BoxGeometry(1, 1, 1),
      capsula: new THREE.CapsuleGeometry(1, 1.2, 4, nivel === 'baixa' ? 6 : 10),
      lathe: n.lathe,
    }
    primitivas.set(nivel, p)
  }
  return p
}

// Nivel corrente. Os builders sao sincronos e rodam todos dentro de
// buildPiece, entao ler daqui evita arrastar o parametro por vinte
// assinaturas — mas e estado escondido: quem chamar um builder por fora pega
// o nivel de quem chamou por ultimo.
let P = conjunto('alta')

const torusCache = new Map()
const torus = (tube, arc, radial = 8, tubular = 20) => {
  const key = `${tube}|${arc}|${radial}|${tubular}`
  let geo = torusCache.get(key)
  if (!geo) {
    geo = new THREE.TorusGeometry(1, tube, radial, tubular, arc)
    torusCache.set(key, geo)
  }
  return geo
}

const compose = (pos, rot = [0, 0, 0], scale = 1) => {
  const s = Array.isArray(scale) ? scale : [scale, scale, scale]
  return new THREE.Matrix4().compose(
    new THREE.Vector3(pos[0], pos[1], pos[2]),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])),
    new THREE.Vector3(s[0], s[1], s[2]),
  )
}

const emptyGroups = () => ({ body: [], accent: [], petal: [], leaf: [], center: [] })

// Empilha uma primitiva transformada dentro de um grupo de material.
const add = (out, group, geo, pos, rot, scale, parent) => {
  const m = compose(pos, rot, scale)
  if (parent) m.premultiply(parent)
  out[group].push(geo.clone().applyMatrix4(m))
  return m
}

const addLathe = (out, group, profile, pos, rot, scale, parent, segments) => {
  const points = profile.map(([x, y]) => new THREE.Vector2(Math.max(x, 0.0001), y))
  // O numero que o builder pede e um TETO, nao uma promessa: em qualidade
  // baixa nenhum perfil passa de 16 lados, nem o prato de 10 cm.
  const geo = new THREE.LatheGeometry(points, Math.min(segments ?? P.lathe, P.lathe))
  const m = compose(pos, rot, scale)
  if (parent) m.premultiply(parent)
  out[group].push(geo.applyMatrix4(m))
  return m
}

// --- flores ---------------------------------------------------------------

// Flor simples de 5 petalas: a base de quase tudo em porcelana fria.
const addSimpleFlower = (out, { pos, rot = [0, 0, 0], size = 1, petals = 5, parent }) => {
  const base = compose(pos, rot, size)
  if (parent) base.premultiply(parent)

  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2
    add(
      out,
      'petal',
      P.petala,
      [Math.cos(a) * 0.014, 0.002, Math.sin(a) * 0.014],
      [0.34 * Math.sin(a), -a, 0.34 * Math.cos(a)],
      [0.011, 0.0035, 0.015],
      base,
    )
  }
  // O miolo tem cor propria: quando usava a cor de destaque da peca,
  // um terno escuro ou um vaso terracota virava um ponto preto na flor.
  add(out, 'center', P.petala, [0, 0.005, 0], [0, 0, 0], 0.005, base)
}

// Rosa: tres aneis de petalas, cada um mais aberto que o de dentro.
const addRose = (out, { pos, rot = [0, 0, 0], size = 1, parent }) => {
  const base = compose(pos, rot, size)
  if (parent) base.premultiply(parent)

  const rings = [
    { count: 3, radius: 0.006, tilt: 0.15, scale: [0.008, 0.003, 0.009] },
    { count: 5, radius: 0.012, tilt: 0.55, scale: [0.01, 0.0035, 0.012] },
    { count: 6, radius: 0.018, tilt: 1.0, scale: [0.012, 0.0035, 0.014] },
  ]

  rings.forEach((ring, r) => {
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 + r * 0.6
      add(
        out,
        'petal',
        P.petala,
        [Math.cos(a) * ring.radius, 0.004 - r * 0.001, Math.sin(a) * ring.radius],
        [ring.tilt * Math.sin(a), -a, ring.tilt * Math.cos(a)],
        ring.scale,
        base,
      )
    }
  })
}

const addLeaf = (out, { pos, rot, size = 1, parent }) => {
  add(out, 'leaf', P.petala, pos, rot, [0.008 * size, 0.002 * size, 0.018 * size], parent)
}

const addStem = (out, { from, to, parent }) => {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const dir = b.clone().sub(a)
  const len = dir.length()
  const mid = a.clone().add(dir.clone().multiplyScalar(0.5))
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  const e = new THREE.Euler().setFromQuaternion(q)
  add(out, 'leaf', P.haste, [mid.x, mid.y, mid.z], [e.x, e.y, e.z], [0.0022, len, 0.0022], parent)
}

// --- perfis de revolucao --------------------------------------------------

const PROFILES = {
  vasoAlto: [
    [0, 0],
    [0.036, 0],
    [0.04, 0.008],
    [0.052, 0.04],
    [0.064, 0.085],
    [0.06, 0.13],
    [0.046, 0.163],
    [0.044, 0.178],
    [0.05, 0.19],
    [0.047, 0.192],
    [0.042, 0.18],
    [0.042, 0.02],
  ],
  potePequeno: [
    [0, 0],
    [0.028, 0],
    [0.032, 0.006],
    [0.04, 0.026],
    [0.042, 0.05],
    [0.045, 0.062],
    [0.042, 0.064],
    [0.038, 0.05],
    [0.038, 0.012],
  ],
  vasinhoBoca: [
    [0, 0],
    [0.022, 0],
    [0.026, 0.005],
    [0.03, 0.02],
    [0.034, 0.036],
    [0.036, 0.042],
    [0.033, 0.044],
    [0.03, 0.034],
    [0.03, 0.01],
  ],
  tigelaRasa: [
    [0, 0],
    [0.03, 0],
    [0.034, 0.004],
    [0.05, 0.026],
    [0.054, 0.034],
    [0.05, 0.035],
    [0.046, 0.026],
    [0.032, 0.008],
  ],
  tampaConcha: [
    [0, 0.014],
    [0.02, 0.013],
    [0.038, 0.007],
    [0.052, 0],
    [0.054, -0.006],
    [0.05, -0.006],
    [0.048, 0],
  ],
  prato: [
    [0, 0],
    [0.05, 0.002],
    [0.08, 0.012],
    [0.098, 0.028],
    [0.1, 0.034],
    [0.096, 0.034],
    [0.088, 0.02],
    [0.06, 0.008],
    [0, 0.006],
  ],
  canecaParede: [
    [0, 0],
    [0.04, 0],
    [0.042, 0.004],
    [0.042, 0.092],
    [0.044, 0.096],
    [0.04, 0.096],
    [0.038, 0.09],
    [0.038, 0.008],
  ],
  discoBase: [
    [0, 0],
    [0.07, 0],
    [0.072, 0.004],
    [0.07, 0.016],
    [0.062, 0.018],
    [0, 0.018],
  ],
}

// --- pecas ----------------------------------------------------------------

const builders = {
  vaso(out) {
    addLathe(out, 'body', PROFILES.vasoAlto, [0, 0, 0])
    // faixa pintada no pe, que da o nome ao "Vaso Brasa"
    addLathe(
      out,
      'accent',
      [
        [0.0365, 0.001],
        [0.0405, 0.009],
        [0.0525, 0.041],
        [0.0535, 0.055],
        [0.049, 0.056],
        [0.0385, 0.012],
      ],
      [0, 0, 0],
    )
  },

  arranjo(out, piece) {
    addLathe(out, 'body', PROFILES.potePequeno, [0, 0, 0])
    addLathe(out, 'accent', PROFILES.potePequeno, [0, 0.0005, 0], [0, 0, 0], [1.008, 0.45, 1.008])

    const count = piece.flowers || 9
    // Arranjo cheio ganha rosas de tres aneis; os menores usam flor simples.
    const rose = count >= 12
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + i * 0.7
      const ring = i % 3
      const r = 0.012 + ring * 0.011
      const h = 0.1 + (i % 4) * 0.016 - ring * 0.012
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      addStem(out, { from: [x * 0.4, 0.05, z * 0.4], to: [x, h, z] })
      const flower = { pos: [x, h, z], rot: [0.3 * Math.sin(a), a, 0.3 * Math.cos(a)], size: 1 }
      if (rose) addRose(out, flower)
      else addSimpleFlower(out, { ...flower, petals: 5 + (i % 2) })
    }

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4
      addLeaf(out, {
        pos: [Math.cos(a) * 0.028, 0.075 + (i % 2) * 0.012, Math.sin(a) * 0.028],
        rot: [0.9, -a, 0],
      })
    }
  },

  caneca(out, piece) {
    addLathe(out, 'body', PROFILES.canecaParede, [0, 0, 0])
    add(out, 'body', P.cilindro, [0, 0.004, 0], [0, 0, 0], [0.039, 0.008, 0.039])
    // alca
    add(out, 'body', torus(0.006, Math.PI * 1.15), [0.04, 0.05, 0], [0, Math.PI / 2, -0.4], [0.026, 0.026, 0.026])
    for (let i = 0; i < (piece.flowers || 4); i++) {
      const a = -0.5 + i * 0.42
      addSimpleFlower(out, {
        pos: [Math.cos(a) * 0.042, 0.05 + (i % 2) * 0.02, Math.sin(a) * 0.042],
        rot: [Math.PI / 2, -a + Math.PI / 2, 0],
        size: 0.85,
      })
    }
  },

  prato(out, piece) {
    addLathe(out, 'body', PROFILES.prato, [0, 0, 0], [0, 0, 0], 1, null, 26)
    addLathe(
      out,
      'accent',
      [
        [0.052, 0.0045],
        [0.058, 0.0055],
        [0.058, 0.0065],
        [0.052, 0.0055],
      ],
      [0, 0, 0],
    )
    const count = piece.flowers || 8
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      addSimpleFlower(out, {
        pos: [Math.cos(a) * 0.084, 0.024, Math.sin(a) * 0.084],
        rot: [0.42, a, 0],
        size: 0.95,
      })
      addLeaf(out, {
        pos: [Math.cos(a + 0.28) * 0.086, 0.019, Math.sin(a + 0.28) * 0.086],
        rot: [0.4, -a - 0.28 + Math.PI / 2, 0],
        size: 0.8,
      })
    }
  },

  portajoias(out) {
    addLathe(out, 'body', PROFILES.tigelaRasa, [0, 0, 0])
    addLathe(out, 'accent', PROFILES.tigelaRasa, [0, 0.001, 0], [0, 0, 0], [0.94, 0.9, 0.94])
    addLathe(out, 'body', PROFILES.tampaConcha, [0, 0.036, 0])
    addRose(out, { pos: [0, 0.05, 0], size: 1.1 })
    addLeaf(out, { pos: [0.016, 0.047, 0.006], rot: [1.2, 0.4, 0], size: 0.8 })
  },

  topo(out, piece) {
    addLathe(out, 'body', PROFILES.discoBase, [0, 0, 0], [0, 0, 0], 1, null, 26)
    // Faixa pintada na borda da base. O raio precisa ficar claramente fora do
    // disco (0.072) para as duas superficies nao brigarem no z-buffer.
    addLathe(
      out,
      'accent',
      [
        [0.0745, 0.003],
        [0.0755, 0.008],
        [0.0745, 0.015],
        [0.0735, 0.013],
      ],
      [0, 0, 0],
      [0, 0, 0],
      1,
      null,
      30,
    )

    // casal: dois corpos em forma de sino, cabeca e cabelo
    const figure = (x, dress, lean) => {
      addLathe(
        out,
        dress ? 'body' : 'accent',
        [
          [0, 0],
          [dress ? 0.03 : 0.018, 0],
          [dress ? 0.026 : 0.016, 0.02],
          [0.013, 0.05],
          [0.012, 0.062],
          [0, 0.062],
        ],
        [x, 0.018, 0],
        [0, 0, lean],
      )
      add(out, 'body', P.esfera, [x + lean * -0.06, 0.088, 0], [0, 0, 0], 0.014)
      add(out, 'accent', P.esfera, [x + lean * -0.062, 0.092, -0.003], [0, 0, 0], [0.015, 0.012, 0.015])
    }
    figure(-0.027, true, 0.1)
    figure(0.029, false, -0.1)

    const count = piece.flowers || 12
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.3
      addSimpleFlower(out, {
        pos: [Math.cos(a) * 0.056, 0.02, Math.sin(a) * 0.056],
        rot: [0.15, a, 0],
        size: 0.62,
      })
      if (i % 2 === 0) {
        addLeaf(out, { pos: [Math.cos(a + 0.24) * 0.061, 0.019, Math.sin(a + 0.24) * 0.061], rot: [0.2, -a, 0], size: 0.55 })
      }
    }
  },

  numero(out, piece) {
    // Dois arcos empilhados leem como um algarismo, sem precisar de fonte 3D.
    const arcs = [
      { y: 0.088, rot: [0, 0, -0.5], r: 0.034 },
      { y: 0.042, rot: [0, 0, 0.35], r: 0.04 },
    ]
    arcs.forEach(({ y, rot, r }) => {
      add(out, 'body', torus(0.011, Math.PI * 1.35), [0, y, 0], rot, [r, r, r])
    })
    // haste que entra no bolo
    add(out, 'body', P.cilindro, [0, 0.008, 0], [0, 0, 0], [0.004, 0.02, 0.004])

    const count = piece.flowers || 14
    for (let i = 0; i < count; i++) {
      const arc = arcs[i % 2]
      const t = Math.floor(i / 2) / Math.max(1, Math.ceil(count / 2) - 1)
      const a = -Math.PI * 0.55 + t * Math.PI * 1.3
      const lean = arc.rot[2]
      const lx = Math.cos(a) * arc.r
      const ly = Math.sin(a) * arc.r
      addSimpleFlower(out, {
        pos: [lx * Math.cos(lean) - ly * Math.sin(lean), arc.y + lx * Math.sin(lean) + ly * Math.cos(lean), 0.012],
        rot: [Math.PI / 2, 0, a],
        size: 0.7,
      })
    }
  },

  lembrancinha(out, piece) {
    addLathe(out, 'body', PROFILES.vasinhoBoca, [0, 0, 0])
    addLathe(out, 'accent', PROFILES.vasinhoBoca, [0, 0.0008, 0], [0, 0, 0], [1.01, 0.5, 1.01])
    const count = piece.flowers || 3
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const x = Math.cos(a) * 0.012
      const z = Math.sin(a) * 0.012
      addStem(out, { from: [x * 0.3, 0.035, z * 0.3], to: [x, 0.064 + (i % 2) * 0.008, z] })
      addSimpleFlower(out, { pos: [x, 0.064 + (i % 2) * 0.008, z], rot: [0.25, a, 0], size: 1.05 })
    }
    addLeaf(out, { pos: [0.02, 0.05, 0.008], rot: [1.0, 0.6, 0], size: 0.7 })
  },

  ima(out) {
    add(out, 'body', P.cilindro, [0, 0.004, 0], [0, 0, 0], [0.026, 0.006, 0.026])
    add(out, 'accent', P.cilindro, [0, 0.0015, 0], [0, 0, 0], [0.012, 0.004, 0.012])
    addRose(out, { pos: [0, 0.008, 0], size: 1.15 })
    addLeaf(out, { pos: [0.02, 0.008, 0.004], rot: [1.3, 0.3, 0], size: 0.85 })
    addLeaf(out, { pos: [-0.018, 0.008, -0.008], rot: [1.3, -2.4, 0], size: 0.8 })
  },

  figura(out) {
    // corpo em sino (a roupa e a cor de destaque)
    addLathe(
      out,
      'accent',
      [
        [0, 0],
        [0.03, 0],
        [0.028, 0.018],
        [0.022, 0.05],
        [0.018, 0.072],
        [0.016, 0.08],
        [0, 0.08],
      ],
      [0, 0, 0],
    )
    // bracos
    add(out, 'accent', P.capsula, [0.019, 0.062, 0.006], [0.3, 0, 0.55], [0.0055, 0.022, 0.0055])
    add(out, 'accent', P.capsula, [-0.019, 0.062, 0.006], [0.3, 0, -0.55], [0.0055, 0.022, 0.0055])
    // maos e cabeca na cor da massa
    add(out, 'body', P.esfera, [0.026, 0.045, 0.012], [0, 0, 0], 0.006)
    add(out, 'body', P.esfera, [-0.026, 0.045, 0.012], [0, 0, 0], 0.006)
    add(out, 'body', P.esfera, [0, 0.098, 0], [0, 0, 0], 0.018)
    // cabelo
    add(out, 'accent', P.esfera, [0, 0.103, -0.004], [0, 0, 0], [0.019, 0.016, 0.019])
    // golinha
    add(out, 'body', torus(0.2, Math.PI * 2, 6, 12), [0, 0.081, 0], [Math.PI / 2, 0, 0], 0.014)
  },

  // --- pecas de cenario (nao clicaveis, so para a prateleira nao ficar vazia) ---
  potinho(out) {
    addLathe(out, 'body', PROFILES.potePequeno, [0, 0, 0], [0, 0, 0], 0.8)
    addLathe(out, 'accent', PROFILES.potePequeno, [0, 0.0008, 0], [0, 0, 0], [0.81, 0.3, 0.81])
  },

  pilhaPratos(out) {
    for (let i = 0; i < 3; i++) {
      addLathe(out, 'body', PROFILES.prato, [0, i * 0.014, 0], [0, 0, 0], 0.62, null, 20)
    }
  },

  potePinceis(out) {
    addLathe(out, 'body', PROFILES.potePequeno, [0, 0, 0], [0, 0, 0], [0.85, 1.5, 0.85])
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      const lean = 0.18
      add(
        out,
        'leaf',
        P.cilindro,
        [Math.cos(a) * 0.014, 0.115, Math.sin(a) * 0.014],
        [lean * Math.sin(a), 0, -lean * Math.cos(a)],
        [0.0035, 0.13, 0.0035],
      )
      add(
        out,
        'accent',
        P.cone,
        [Math.cos(a) * 0.026, 0.178, Math.sin(a) * 0.026],
        [lean * Math.sin(a), 0, -lean * Math.cos(a)],
        [0.006, 0.026, 0.006],
      )
    }
  },

  rolo(out) {
    add(out, 'body', P.cilindro, [0, 0, 0], [0, 0, Math.PI / 2], [0.026, 0.19, 0.026])
    add(out, 'accent', P.cilindro, [0.125, 0, 0], [0, 0, Math.PI / 2], [0.012, 0.07, 0.012])
    add(out, 'accent', P.cilindro, [-0.125, 0, 0], [0, 0, Math.PI / 2], [0.012, 0.07, 0.012])
  },

  tigelaMassa(out) {
    addLathe(out, 'body', PROFILES.tigelaRasa, [0, 0, 0], [0, 0, 0], 1.25)
    // bolinha de massa dentro
    add(out, 'accent', P.esfera, [0.004, 0.024, -0.003], [0, 0, 0], [0.03, 0.018, 0.028])
  },

  caderno(out) {
    add(out, 'body', P.caixa, [0, 0.006, 0], [0, 0, 0], [0.19, 0.012, 0.135])
    add(out, 'accent', P.caixa, [0, 0.013, 0], [0, 0, 0], [0.186, 0.003, 0.131])
    // lapis atravessado
    add(out, 'accent', P.cilindro, [0.03, 0.018, 0.04], [0, 0.5, Math.PI / 2], [0.004, 0.15, 0.004])
  },

  // Flores meio prontas em cima do tapete de corte: o trabalho em andamento.
  floresSoltas(out) {
    const spots = [
      { pos: [0, 0.004, 0], size: 1.2, rose: true },
      { pos: [0.062, 0.003, 0.03], size: 1.0, rose: false },
      { pos: [-0.055, 0.003, 0.042], size: 0.9, rose: false },
      { pos: [0.028, 0.003, -0.055], size: 1.05, rose: true },
      { pos: [-0.08, 0.003, -0.02], size: 0.8, rose: false },
    ]
    spots.forEach(({ pos, size, rose }, i) => {
      if (rose) addRose(out, { pos, rot: [0, i * 1.1, 0], size })
      else addSimpleFlower(out, { pos, rot: [0, i * 0.8, 0], size, petals: 5 + (i % 2) })
    })
    // petalas ainda soltas, esperando serem montadas
    for (let i = 0; i < 7; i++) {
      const a = i * 1.7
      add(
        out,
        'petal',
        P.petala,
        [Math.cos(a) * (0.05 + (i % 3) * 0.028), 0.0018, Math.sin(a) * (0.045 + (i % 2) * 0.03)],
        [0, a, 0],
        [0.011, 0.0025, 0.015],
      )
    }
    // bolinhas de massa crua
    for (let i = 0; i < 3; i++) {
      add(out, 'body', P.esfera, [-0.1 + i * 0.026, 0.008, 0.07], [0, 0, 0], 0.009)
    }
  },

  planta(out) {
    addLathe(out, 'body', PROFILES.potePequeno, [0, 0, 0], [0, 0, 0], 1.35)
    add(out, 'accent', P.esfera, [0, 0.07, 0], [0, 0, 0], [0.05, 0.012, 0.05])
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + i * 0.5
      const h = 0.09 + (i % 4) * 0.035
      const r = 0.02 + (i % 3) * 0.018
      addStem(out, { from: [0, 0.07, 0], to: [Math.cos(a) * r, h, Math.sin(a) * r] })
      add(
        out,
        'leaf',
        P.petala,
        [Math.cos(a) * r, h + 0.014, Math.sin(a) * r],
        [0.5 * Math.sin(a), -a, 0.5 * Math.cos(a)],
        [0.016, 0.004, 0.032],
      )
    }
  },
}

/**
 * Monta uma peca e devolve uma geometria por material.
 * @returns {{body?:THREE.BufferGeometry, accent?:THREE.BufferGeometry, petal?:THREE.BufferGeometry, leaf?:THREE.BufferGeometry}}
 */
// A geometria depende so de forma e nivel — a cor vem do material —, entao duas
// pecas iguais na cena dividem uma geometria so. Ela vive enquanto a pagina
// vive, como os materiais das plantas: por isso nao ha descarte por instancia.
const cache = new Map()

export function buildPiece(piece, { qualidade = 'alta' } = {}) {
  const nivel = NIVEIS[qualidade] ? qualidade : 'alta'
  const chave = `${piece.kind}|${piece.flowers ?? ''}|${nivel}`
  const pronto = cache.get(chave)
  if (pronto) return pronto

  P = conjunto(nivel)
  const build = builders[piece.kind] ?? builders.vaso
  const out = emptyGroups()
  build(out, piece)

  const result = {}
  for (const [group, list] of Object.entries(out)) {
    if (!list.length) continue
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false)
    // As primitivas compartilhadas foram clonadas antes de transformar, mas as
    // parciais viram lixo assim que a mesclagem termina.
    if (list.length > 1) list.forEach((g) => g.dispose())
    merged.computeBoundingBox()
    merged.computeBoundingSphere()
    result[group] = merged
  }
  cache.set(chave, result)
  return result
}

/** Altura util da peca, para posicionar rotulos e o anel de destaque. */
export function pieceHeight(built) {
  let max = 0
  Object.values(built ?? {}).forEach((geo) => {
    if (geo?.boundingBox) max = Math.max(max, geo.boundingBox.max.y)
  })
  return max
}

/** Raio no plano do chao, usado pelo anel de destaque. */
export function pieceRadius(built) {
  let max = 0
  Object.values(built ?? {}).forEach((geo) => {
    const bb = geo?.boundingBox
    if (!bb) return
    max = Math.max(max, Math.abs(bb.max.x), Math.abs(bb.min.x), Math.abs(bb.max.z), Math.abs(bb.min.z))
  })
  return max
}
