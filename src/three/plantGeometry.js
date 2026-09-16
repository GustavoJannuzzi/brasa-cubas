import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Gerador de plantas do ateliê. Mesma regra do pieceGeometry: nenhum modelo
// externo, tudo montado por codigo e mesclado em uma geometria por material.
//
// A diferenca esta na folha. Esfera achatada — o que a cena usava antes —
// passa de longe e entrega o truque no close-up. Aqui cada folha e uma malha
// parametrica: afina na base e na ponta, faz calha no meio, cai pelo proprio
// peso, torce um pouco e leva a cor variando da base (escura) para a ponta
// (clara) em vertex color, com a nervura central um tom acima. Haste e tubo
// sobre curva Catmull-Rom com raio afinando, nao cilindro reto.
//
// Tudo cai em um de cinco grupos de material (folha, haste, vaso, terra,
// corda) e cada grupo e mesclado numa geometria: uma planta inteira sai em
// 4 ou 5 draw calls.

const emptyGroups = () => ({ leaf: [], stem: [], pot: [], soil: [], cord: [] })

const EIXO = { x: 0, y: 1, z: 2 }

/**
 * Matriz que aponta o +z local para `dir`, com o +y local para cima.
 * Existe para nao depender de ordem de Euler: folha e foliolo sao sempre
 * construidos ao longo do +z e posicionados dizendo para onde eles olham.
 */
const aim = (pos, dir, roll = 0, cima = null) => {
  const z = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize()
  // `cima` troca a referencia de "para cima" da peca. Sem ela, quem manda e o
  // eixo y do mundo: na hera isso deixava a folha de espeto para fora da
  // parede, com a face virada para o teto.
  const up = cima
    ? new THREE.Vector3(cima[0], cima[1], cima[2])
    : Math.abs(z.y) > 0.999
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0)
  const x = new THREE.Vector3().crossVectors(up, z).normalize()
  const y = new THREE.Vector3().crossVectors(z, x)
  const m = new THREE.Matrix4().makeBasis(x, y, z)
  if (roll) m.multiply(new THREE.Matrix4().makeRotationZ(roll))
  m.setPosition(pos[0], pos[1], pos[2])
  return m
}

const put = (out, group, geo, matrix) => {
  out[group].push(matrix ? geo.applyMatrix4(matrix) : geo)
}

/**
 * Pinta a geometria em vertex color, opcionalmente em degrade num eixo.
 * Todo material de planta usa vertexColors, entao nenhuma geometria pode
 * entrar num grupo sem o atributo de cor — a mesclagem quebraria.
 */
const paint = (geo, corA, corB, eixo = 'y') => {
  const pos = geo.attributes.position
  const a = new THREE.Color(corA)
  const b = corB ? new THREE.Color(corB) : null
  const c = new THREE.Color()
  const arr = new Float32Array(pos.count * 3)
  const comp = EIXO[eixo]
  let lo = Infinity
  let hi = -Infinity
  if (b) {
    for (let i = 0; i < pos.count; i++) {
      const v = pos.getComponent(i, comp)
      if (v < lo) lo = v
      if (v > hi) hi = v
    }
  }
  const span = hi - lo || 1
  for (let i = 0; i < pos.count; i++) {
    if (b) c.copy(a).lerp(b, (pos.getComponent(i, comp) - lo) / span)
    else c.copy(a)
    arr[i * 3] = c.r
    arr[i * 3 + 1] = c.g
    arr[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3))
  return geo
}

const lathe = (profile, segments = 22) =>
  new THREE.LatheGeometry(
    profile.map(([x, y]) => new THREE.Vector2(Math.max(x, 0.0001), y)),
    segments,
  )

/** Grade de indices de uma malha u x v. */
const gradeIndices = (segsU, segsV) => {
  const index = []
  const stride = segsV + 1
  for (let i = 0; i < segsU; i++) {
    for (let j = 0; j < segsV; j++) {
      const a = i * stride + j
      const b = a + 1
      const d = a + stride
      const e = d + 1
      index.push(a, d, b, b, d, e)
    }
  }
  return index
}

const montar = (position, color, uv, index) => {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
  geo.setAttribute('color', new THREE.Float32BufferAttribute(color, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(index)
  geo.computeVertexNormals()
  return geo
}

// --- folha ----------------------------------------------------------------

/**
 * Uma folha, construida ao longo do +z com a base na origem.
 *
 * `base` e `ponta` moldam a silhueta: a meia-largura e
 * `sin(PI * u^base)^ponta`, que da zero nas duas extremidades e desloca o
 * bojo para tras quando `base` < 1. `calha` levanta as bordas — e o que da
 * volume em vez de papel — e `queda` derruba a ponta pelo proprio peso.
 */
const folha = ({
  comprimento = 0.12,
  largura = 0.06,
  queda = 0.3,
  calha = 0.45,
  base = 0.72,
  ponta = 1.4,
  torcao = 0,
  segsU = 8,
  segsV = 4,
  corA = '#39562f',
  corB = '#8fae5b',
}) => {
  const cA = new THREE.Color(corA)
  const cB = new THREE.Color(corB)
  const c = new THREE.Color()
  const position = []
  const color = []
  const uv = []

  for (let i = 0; i <= segsU; i++) {
    const u = i / segsU
    const meia = (largura / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, base)), ponta)
    const z = comprimento * u
    const yMeio = -queda * comprimento * u * u
    const tw = torcao * u
    const sn = Math.sin(tw)
    const cs = Math.cos(tw)
    c.copy(cA).lerp(cB, Math.pow(u, 0.65))

    for (let j = 0; j <= segsV; j++) {
      const v = (j / segsV) * 2 - 1
      const x0 = v * meia
      const y0 = calha * meia * v * v
      position.push(x0 * cs - y0 * sn, yMeio + x0 * sn + y0 * cs, z)
      uv.push((v + 1) / 2, u)
      // nervura central um tom acima: e o que faz a folha ler como folha
      const nervura = 1 + (1 - Math.min(1, Math.abs(v) * 3.4)) * 0.11
      color.push(c.r * nervura, c.g * nervura, c.b * nervura)
    }
  }

  return montar(position, color, uv, gradeIndices(segsU, segsV))
}

// --- haste ----------------------------------------------------------------

const curva = (pontos) =>
  new THREE.CatmullRomCurve3(
    pontos.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    'catmullrom',
    0.35,
  )

/** Tubo sobre uma curva, com raio afinando de r0 (base) a r1 (ponta). */
const tubo = (
  caminho,
  { r0 = 0.005, r1 = 0.0018, radial = 6, segs = 14, corA = '#4a5c33', corB = '#74884a' },
) => {
  const frames = caminho.computeFrenetFrames(segs, false)
  const position = []
  const color = []
  const uv = []
  const cA = new THREE.Color(corA)
  const cB = new THREE.Color(corB)
  const c = new THREE.Color()

  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const p = caminho.getPointAt(t)
    const N = frames.normals[i]
    const B = frames.binormals[i]
    const r = r0 + (r1 - r0) * t
    c.copy(cA).lerp(cB, t)
    for (let j = 0; j <= radial; j++) {
      // Angulo no sentido negativo: com o positivo, a grade saia com as
      // normais para DENTRO e toda haste, corda e peciolo ficava oca vista
      // de fora (o material de haste e face simples).
      const ang = -(j / radial) * Math.PI * 2
      const sn = Math.sin(ang)
      const cs = Math.cos(ang)
      position.push(
        p.x + r * (cs * N.x + sn * B.x),
        p.y + r * (cs * N.y + sn * B.y),
        p.z + r * (cs * N.z + sn * B.z),
      )
      color.push(c.r, c.g, c.b)
      uv.push(j / radial, t)
    }
  }

  return montar(position, color, uv, gradeIndices(segs, radial))
}

// --- coluna costelada (cacto) ---------------------------------------------

const colunaCostelada = ({ altura = 0.15, raio = 0.032, costelas = 9, amp = 0.15, segsU = 11, corA, corB }) => {
  const segs = costelas * 4
  const position = []
  const color = []
  const uv = []
  const cA = new THREE.Color(corA)
  const cB = new THREE.Color(corB)
  const c = new THREE.Color()

  for (let i = 0; i <= segsU; i++) {
    const u = i / segsU
    const y = altura * u
    const perfil = raio * Math.pow(Math.sin(Math.PI * (0.05 + 0.95 * u)), 0.22)
    c.copy(cA).lerp(cB, Math.sin(Math.PI * u * 0.85))
    for (let j = 0; j <= segs; j++) {
      const ang = (j / segs) * Math.PI * 2
      const r = perfil * (1 + amp * Math.cos(costelas * ang))
      position.push(Math.cos(ang) * r, y, Math.sin(ang) * r)
      uv.push(j / segs, u)
      // crista da costela mais clara, vale mais escuro
      const luz = 1 + Math.cos(costelas * ang) * 0.07
      color.push(c.r * luz, c.g * luz, c.b * luz)
    }
  }

  return montar(position, color, uv, gradeIndices(segsU, segs))
}

// --- vaso, terra e acessorios ---------------------------------------------

const BARRO = ['#9c5135', '#c4744d']
const TERRA = ['#3d2c20', '#22190f']
const CORDA = ['#c3ab81', '#e2d0ae']
const MADEIRA = ['#7a5238', '#9c6f4a']

const vasoBarro = (out, { rBase = 0.07, rTopo = 0.1, alt = 0.13, corA = BARRO[0], corB = BARRO[1] }) => {
  const p = [
    [0, 0],
    [rBase * 0.96, 0],
    [rBase, 0.01],
    [rTopo * 0.93, alt * 0.8],
    [rTopo, alt * 0.86],
    [rTopo * 1.07, alt * 0.9],
    [rTopo * 1.07, alt],
    [rTopo * 0.98, alt],
    [rTopo * 0.96, alt * 0.9],
    [rTopo * 0.86, alt * 0.8],
    [rBase * 0.88, 0.012],
    // fecha o fundo por dentro: sem este ponto o perfil termina num furo e,
    // de cima, se ve o vazio do vaso
    [0, 0.012],
  ]
  const vaso = paint(lathe(p, 26), corA, corB, 'y')
  // quem segura o vaso (suporte de parede, macrame) precisa saber onde ele e
  // mais largo, em vez de chutar um raio fixo
  vaso.userData.aro = { r: rTopo * 0.965, alt: alt * 0.83 }
  put(out, 'pot', vaso)
}

const cachepo = (out, { r = 0.085, alt = 0.1, corA = '#b08b6e', corB = '#d3b48d' }) => {
  const p = [
    [0, 0],
    [r * 0.82, 0],
    [r * 0.88, 0.012],
    [r, alt * 0.55],
    [r * 0.99, alt],
    [r * 0.92, alt],
    [r * 0.9, alt * 0.5],
    [r * 0.78, 0.014],
    [0, 0.014],
  ]
  const cesto = paint(lathe(p, 22), corA, corB, 'y')
  cesto.userData.aro = { r, alt: alt * 0.55 }
  put(out, 'pot', cesto)
  // tranca: tres aros marcando a fibra
  for (let i = 0; i < 3; i++) {
    const aro = new THREE.TorusGeometry(r * 0.99, 0.0045, 5, 20)
    aro.rotateX(Math.PI / 2)
    aro.translate(0, alt * (0.22 + i * 0.27), 0)
    put(out, 'pot', paint(aro, corB, corA, 'y'))
  }
}

const terra = (out, { r = 0.09, y = 0.11, rnd }) => {
  const p = [
    [0, y],
    [r * 0.55, y - 0.003],
    [r * 0.88, y - 0.013],
    [r, y - 0.03],
  ]
  put(out, 'soil', paint(lathe(p, 20), TERRA[0], TERRA[1], 'y'))
  // pedrinhas: quebram o disco liso de terra
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2
    const d = r * (0.25 + rnd() * 0.6)
    const s = 0.004 + rnd() * 0.005
    const pedra = new THREE.SphereGeometry(1, 6, 4)
    pedra.scale(s, s * 0.6, s * 0.85)
    pedra.translate(Math.cos(a) * d, y - 0.004 - d * 0.1, Math.sin(a) * d)
    put(out, 'soil', paint(pedra, '#8a7a67', '#5f5346', 'y'))
  }
}

/**
 * Suporte de parede: a mao de ferro que segura o vaso.
 * `r` e o raio do vaso na altura do aro e `comp` o alcance do braco ate a
 * parede. Os dois vem de quem chama: com os valores fixos de antes, o aro da
 * suculenta ficava com quase o dobro do raio do vaso (sem segurar nada) e o
 * braco ora entrava 5 cm na parede, ora parava 2 cm antes dela.
 */
const suporteParede = (out, { r = 0.075, alt = 0.04, comp = 0.1 }) => {
  const FERRO = ['#4e453c', '#6b6055']
  const braco = new THREE.BoxGeometry(0.02, 0.016, comp)
  braco.translate(0, -0.012, -comp / 2)
  put(out, 'pot', paint(braco, FERRO[0], FERRO[1], 'y'))
  const aro = new THREE.TorusGeometry(r * 1.02, 0.006, 6, 24)
  aro.rotateX(Math.PI / 2)
  aro.translate(0, alt, 0)
  put(out, 'pot', paint(aro, FERRO[0], FERRO[1], 'y'))
  const apoio = new THREE.BoxGeometry(0.016, 0.055, 0.014)
  apoio.translate(0, alt - 0.03, -r * 0.95)
  put(out, 'pot', paint(apoio, FERRO[0], FERRO[1], 'y'))
}

/** Banquinho de madeira em que a planta de chao se apoia. */
const banquinho = (out, { h = 0.46, r = 0.15 }) => {
  // Perfil de baixo para cima: no sentido inverso o lathe montava o tampo do
  // avesso, com a face de cima apontando para o chao.
  const topo = lathe(
    [
      [0, -0.026],
      [r * 0.94, -0.026],
      [r, -0.022],
      [r, 0],
      [0, 0],
    ],
    24,
  )
  put(out, 'pot', paint(topo, MADEIRA[1], MADEIRA[0], 'y'))
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const pe = curva([
      [Math.cos(a) * r * 0.62, -0.03, Math.sin(a) * r * 0.62],
      [Math.cos(a) * r * 0.82, -h * 0.55, Math.sin(a) * r * 0.82],
      [Math.cos(a) * r * 1.02, -h, Math.sin(a) * r * 1.02],
    ])
    put(out, 'pot', tubo(pe, { r0: 0.014, r1: 0.011, radial: 6, segs: 8, corA: MADEIRA[0], corB: MADEIRA[1] }))
  }
}

/** Macrame: quatro cordas do gancho ate por baixo do vaso, com nos. */
const macrame = (out, { queda = 0.5, rVaso = 0.085 }) => {
  const anel = new THREE.TorusGeometry(0.014, 0.004, 6, 16)
  anel.rotateX(Math.PI / 2)
  put(out, 'cord', paint(anel, CORDA[1], CORDA[0], 'y'))

  const noY = -queda * 0.62
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const cx = Math.cos(a)
    const cz = Math.sin(a)
    const fio = curva([
      [cx * 0.012, -0.006, cz * 0.012],
      [cx * rVaso * 0.55, noY * 0.6, cz * rVaso * 0.55],
      [cx * rVaso * 1.02, noY, cz * rVaso * 1.02],
      [cx * rVaso * 0.92, -queda + 0.018, cz * rVaso * 0.92],
      [cx * rVaso * 0.2, -queda - 0.012, cz * rVaso * 0.2],
    ])
    put(out, 'cord', tubo(fio, { r0: 0.0032, r1: 0.0032, radial: 5, segs: 20, corA: CORDA[0], corB: CORDA[1] }))

    const no = new THREE.SphereGeometry(0.0075, 7, 5)
    no.translate(cx * rVaso * 1.02, noY, cz * rVaso * 1.02)
    put(out, 'cord', paint(no, CORDA[1], CORDA[0], 'y'))
  }
}

// --- conjuntos de folha ---------------------------------------------------

/**
 * Folha recortada da costela-de-adao: nervura central e foliolos crescendo
 * ate o meio. Fenda de verdade na malha sairia caro; o recorte vem de montar
 * a folha em tiras, que e como a planta e de fato.
 */
const folhaRecortada = (out, matriz, { comprimento, largura, lobos, corA, corB, segsU, segsV }) => {
  const nervura = curva([
    [0, 0, 0],
    [0, -comprimento * 0.04, comprimento * 0.5],
    [0, -comprimento * 0.17, comprimento],
  ])
  put(out, 'stem', tubo(nervura, { r0: 0.0055, r1: 0.0012, radial: 5, segs: 10, corA, corB }), matriz.clone())

  for (let i = 1; i <= lobos; i++) {
    const t = i / (lobos + 0.7)
    const p = nervura.getPointAt(t)
    const escala = Math.sin(Math.PI * Math.min(0.97, t * 0.86 + 0.16))
    for (const lado of [-1, 1]) {
      const lamina = folha({
        comprimento: largura * 0.56 * escala,
        largura: largura * 0.34 * escala,
        queda: 0.22,
        calha: 0.3,
        base: 0.8,
        ponta: 1.3,
        segsU,
        segsV,
        corA,
        corB,
      })
      const dir = [lado * 0.88, -0.12 - t * 0.22, 0.46 - t * 0.2]
      put(out, 'leaf', lamina, matriz.clone().multiply(aim([p.x, p.y, p.z], dir, lado * 0.25)))
    }
  }
}

/** Folha de hera: tres lobos saindo do mesmo ponto. */
const folhaTresLobos = (out, matriz, { tamanho, corA, corB, segsU, segsV }) => {
  const lobos = [
    { dir: [0, 0, 1], escala: 1 },
    { dir: [0.72, 0, 0.62], escala: 0.66 },
    { dir: [-0.72, 0, 0.62], escala: 0.66 },
  ]
  lobos.forEach(({ dir, escala }) => {
    const lamina = folha({
      comprimento: tamanho * escala,
      largura: tamanho * 0.72 * escala,
      queda: 0.14,
      calha: 0.24,
      base: 0.5,
      ponta: 1.15,
      segsU,
      segsV,
      corA,
      corB,
    })
    put(out, 'leaf', lamina, matriz.clone().multiply(aim([0, 0, 0], dir)))
  })
}

/** Fronde de samambaia: raque arqueada com foliolos dos dois lados. */
const fronde = (out, { caminho, foliolos, tamanho, corA, corB, segsU, segsV }) => {
  put(out, 'stem', tubo(caminho, { r0: 0.005, r1: 0.001, radial: 5, segs: 16, corA, corB }))

  const cima = new THREE.Vector3(0, 1, 0)
  for (let k = 1; k <= foliolos; k++) {
    const t = k / (foliolos + 1)
    const p = caminho.getPointAt(t)
    const tg = caminho.getTangentAt(t)
    const lateral = new THREE.Vector3().crossVectors(tg, cima).normalize()
    const escala = Math.sin(Math.PI * Math.pow(t, 0.5)) * (1 - t * 0.35)
    for (const lado of [-1, 1]) {
      const dir = new THREE.Vector3()
        .addScaledVector(tg, 0.42)
        .addScaledVector(lateral, lado * 0.88)
        .addScaledVector(cima, -0.12)
      const lamina = folha({
        comprimento: tamanho * escala,
        largura: tamanho * 0.42 * escala,
        queda: 0.3,
        calha: 0.34,
        base: 0.78,
        ponta: 1.2,
        torcao: lado * 0.25,
        segsU,
        segsV,
        corA,
        corB,
      })
      // O "para cima" do foliolo e a normal do plano da fronde. Com o y do
      // mundo, no trecho em que a raque desce eles viravam escova de garrafa.
      const plano = new THREE.Vector3().crossVectors(lateral, tg).normalize()
      put(out, 'leaf', lamina, aim([p.x, p.y, p.z], [dir.x, dir.y, dir.z], lado * 0.3, plano.toArray()))
    }
  }
}

// --- especies -------------------------------------------------------------

const VERDE = {
  costela: ['#2c4526', '#5e8443'],
  espada: ['#31502c', '#8aa550'],
  samambaia: ['#3a5a29', '#87a755'],
  jiboia: ['#37552d', '#93b25c'],
  suculenta: ['#5d7d58', '#aec394'],
  cacto: ['#476b43', '#83a46c'],
  hera: ['#2a4324', '#6d8f43'],
}

const especies = {
  /** Costela-de-adao de chao: a planta grande que da escala ao comodo. */
  costela(out, { alta, rnd }) {
    const [corA, corB] = VERDE.costela
    const folhas = alta ? 8 : 5
    vasoBarro(out, { rBase: 0.085, rTopo: 0.125, alt: 0.17 })
    terra(out, { r: 0.108, y: 0.152, rnd })

    for (let i = 0; i < folhas; i++) {
      const a = (i / folhas) * Math.PI * 2 + rnd() * 0.9
      const alto = 0.34 + rnd() * 0.34
      const abre = 0.14 + rnd() * 0.24
      const peciolo = curva([
        [0, 0.13, 0],
        [Math.cos(a) * abre * 0.4, 0.13 + alto * 0.52, Math.sin(a) * abre * 0.4],
        [Math.cos(a) * abre, 0.13 + alto, Math.sin(a) * abre],
      ])
      put(out, 'stem', tubo(peciolo, { r0: 0.0085, r1: 0.005, radial: 6, segs: 10, corA, corB }))
      folhaRecortada(
        out,
        aim(
          [Math.cos(a) * abre, 0.13 + alto, Math.sin(a) * abre],
          [Math.cos(a) * 0.8, -0.34 - rnd() * 0.2, Math.sin(a) * 0.8],
          rnd() * 0.5 - 0.25,
        ),
        {
          comprimento: 0.26 + rnd() * 0.1,
          largura: 0.24 + rnd() * 0.06,
          lobos: alta ? 6 : 4,
          segsU: alta ? 5 : 4,
          segsV: alta ? 3 : 2,
          corA,
          corB,
        },
      )
    }
  },

  /** Espada-de-sao-jorge: leque de folhas em pe, boa contra a parede. */
  espada(out, { alta, rnd }) {
    const [corA, corB] = VERDE.espada
    const folhas = alta ? 13 : 9
    cachepo(out, { r: 0.1, alt: 0.15 })
    terra(out, { r: 0.088, y: 0.14, rnd })

    for (let i = 0; i < folhas; i++) {
      const a = (i / folhas) * Math.PI * 2 + rnd() * 0.6
      const d = 0.012 + rnd() * 0.038
      const inclina = 0.16 + rnd() * 0.2
      const lamina = folha({
        comprimento: 0.4 + rnd() * 0.32,
        largura: 0.062 + rnd() * 0.022,
        queda: 0.17 + rnd() * 0.12,
        calha: 0.62,
        base: 0.42,
        ponta: 0.85,
        torcao: (rnd() - 0.5) * 0.7,
        segsU: alta ? 9 : 6,
        segsV: alta ? 3 : 2,
        corA,
        corB,
      })
      put(
        out,
        'leaf',
        lamina,
        aim(
          [Math.cos(a) * d, 0.132, Math.sin(a) * d],
          [Math.cos(a) * inclina, 1, Math.sin(a) * inclina],
          // Giro pequeno em volta do proprio eixo. Com o giro inteiro (2π),
          // metade das folhas caia para DENTRO do leque.
          (rnd() - 0.5) * 1.2,
        ),
      )
    }
  },

  /** Samambaia: fronde arqueada saindo do centro. Boa pendurada. */
  samambaia(out, { alta, rnd }) {
    const [corA, corB] = VERDE.samambaia
    const fronde_n = alta ? 13 : 8
    cachepo(out, { r: 0.082, alt: 0.095 })
    terra(out, { r: 0.072, y: 0.09, rnd })

    for (let i = 0; i < fronde_n; i++) {
      const a = (i / fronde_n) * Math.PI * 2 + rnd() * 0.5
      const comprimento = 0.26 + rnd() * 0.16
      const tomba = 0.1 + rnd() * 0.24
      fronde(out, {
        caminho: curva([
          [0, 0.085, 0],
          [Math.cos(a) * comprimento * 0.26, 0.17 + tomba * 0.2, Math.sin(a) * comprimento * 0.26],
          [Math.cos(a) * comprimento * 0.68, 0.16 - tomba * 0.14, Math.sin(a) * comprimento * 0.68],
          [Math.cos(a) * comprimento, 0.05 - tomba, Math.sin(a) * comprimento],
        ]),
        foliolos: alta ? 15 : 9,
        tamanho: 0.05 + rnd() * 0.014,
        segsU: alta ? 5 : 3,
        segsV: 2,
        corA,
        corB,
      })
    }
  },

  /** Jiboia: ramos caindo com folha de coracao. Prateleira e pendurada. */
  jiboia(out, { alta, rnd, frente }) {
    const [corA, corB] = VERDE.jiboia
    const ramos = alta ? 6 : 4
    // `frente`: em cima de uma tabua os ramos so podem cair para a frente
    // dela. Em volta do vaso, metade atravessava a propria tabua.
    const alc = frente ? 0.12 : 0
    cachepo(out, { r: 0.075, alt: 0.085, corA: '#a8724f', corB: '#c99568' })
    terra(out, { r: 0.066, y: 0.08, rnd })

    for (let i = 0; i < ramos; i++) {
      const a = frente
        ? Math.PI / 2 + ((i + 0.5) / ramos - 0.5) * 1.0 + (rnd() - 0.5) * 0.2
        : (i / ramos) * Math.PI * 2 + rnd() * 0.8
      const comprimento = 0.3 + rnd() * 0.42
      const cx = Math.cos(a)
      const cz = Math.sin(a)
      const ramo = curva([
        [cx * 0.02, 0.085, cz * 0.02],
        [cx * 0.07, 0.12, cz * 0.07],
        [cx * (0.095 + alc), 0.03, cz * (0.095 + alc)],
        [cx * (0.07 + alc + rnd() * 0.05), -comprimento * 0.5, cz * (0.07 + alc + rnd() * 0.05)],
        [cx * (0.05 + alc + rnd() * 0.07), -comprimento, cz * (0.05 + alc + rnd() * 0.07)],
      ])
      put(out, 'stem', tubo(ramo, { r0: 0.0035, r1: 0.0018, radial: 5, segs: 18, corA, corB }))

      const n = alta ? 9 : 6
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 0.4)
        const p = ramo.getPointAt(t)
        // Giro alternado em volta do ramo: com o passo fixo de 2.3 rad,
        // mais da metade das folhas apontava para o eixo da planta e entrava
        // no cachepo.
        const giro = a + (k % 2 === 0 ? 1 : -1) * (0.45 + ((k * 0.37) % 0.5))
        const tam = (0.055 + rnd() * 0.022) * (1 - t * 0.35)
        const lamina = folha({
          comprimento: tam,
          largura: tam * 0.86,
          queda: 0.42,
          calha: 0.3,
          base: 0.45,
          ponta: 1.1,
          torcao: (rnd() - 0.5) * 0.5,
          segsU: alta ? 6 : 4,
          segsV: alta ? 4 : 2,
          corA,
          corB,
        })
        put(
          out,
          'leaf',
          lamina,
          aim([p.x, p.y, p.z], [Math.cos(giro) * 0.85, -0.42 - rnd() * 0.3, Math.sin(giro) * 0.85], rnd() * 0.6),
        )
      }
    }
  },

  /** Suculenta em roseta: tres aneis de folha grossa abrindo para fora. */
  suculenta(out, { alta, rnd }) {
    const [corA, corB] = VERDE.suculenta
    vasoBarro(out, { rBase: 0.028, rTopo: 0.037, alt: 0.036, corA: '#a55f42', corB: '#c98560' })
    const aneis = [
      { n: 5, d: 0.002, inclina: 0.2, tam: 0.034 },
      { n: 7, d: 0.009, inclina: 0.78, tam: 0.03 },
      { n: alta ? 9 : 7, d: 0.018, inclina: 1.24, tam: 0.024 },
    ]
    aneis.forEach((anel, r) => {
      for (let i = 0; i < anel.n; i++) {
        const a = (i / anel.n) * Math.PI * 2 + r * 0.7
        const lamina = folha({
          comprimento: anel.tam,
          largura: anel.tam * 0.66,
          queda: 0.1,
          calha: 0.95,
          base: 0.62,
          ponta: 1.05,
          segsU: 5,
          segsV: alta ? 4 : 3,
          corA: r === 2 ? corA : corB,
          corB: r === 2 ? corB : '#c3d3ac',
        })
        const dir = [
          Math.cos(a) * Math.sin(anel.inclina),
          Math.cos(anel.inclina),
          Math.sin(a) * Math.sin(anel.inclina),
        ]
        put(out, 'leaf', lamina, aim([Math.cos(a) * anel.d, 0.035, Math.sin(a) * anel.d], dir))
      }
    })
  },

  /** Cacto: coluna costelada, espinhos e uma flor. */
  cacto(out, { alta, rnd }) {
    const [corA, corB] = VERDE.cacto
    vasoBarro(out, { rBase: 0.036, rTopo: 0.046, alt: 0.05 })
    terra(out, { r: 0.036, y: 0.05, rnd })

    const altura = 0.15 + rnd() * 0.05
    const coluna = colunaCostelada({
      altura,
      raio: 0.032,
      costelas: 9,
      amp: 0.15,
      segsU: alta ? 12 : 8,
      corA,
      corB,
    })
    coluna.translate(0, 0.042, 0)
    put(out, 'leaf', coluna)

    const braco = colunaCostelada({
      altura: altura * 0.42,
      raio: 0.019,
      costelas: 7,
      amp: 0.16,
      segsU: 7,
      corA,
      corB,
    })
    // A coluna cresce em +y e o aim alinha o +z: sem girar a geometria antes,
    // o braco saia 90 graus fora do pretendido, para dentro do tronco.
    braco.rotateX(Math.PI / 2)
    put(out, 'leaf', braco, aim([0.018, 0.042 + altura * 0.34, 0.004], [1, 0.55, 0.12]))

    if (alta) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 6
        const y = 0.055 + (i / 16) * altura * 0.86
        const espinho = new THREE.ConeGeometry(0.0016, 0.007, 4)
        espinho.rotateX(Math.PI / 2)
        put(
          out,
          'stem',
          paint(espinho, '#e8dcc2', '#b8a68a', 'z'),
          aim([Math.cos(a) * 0.033, y, Math.sin(a) * 0.033], [Math.cos(a), 0.25, Math.sin(a)]),
        )
      }
    }

    // flor no topo: o ponto de cor que salva o cacto de ser um tubo verde
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const petala = folha({
        comprimento: 0.016,
        largura: 0.009,
        queda: 0.1,
        calha: 0.5,
        base: 0.7,
        ponta: 1.2,
        segsU: 4,
        segsV: 2,
        corA: '#d9748a',
        corB: '#f2c0c8',
      })
      put(out, 'leaf', petala, aim([0, 0.042 + altura, 0], [Math.cos(a) * 0.7, 0.72, Math.sin(a) * 0.7]))
    }
  },

  /**
   * Hera: ramos rastejando na parede. Construida no plano xy local, com o
   * +z apontando para fora da parede — quem posiciona gira o grupo.
   */
  hera(out, { alta, rnd }) {
    const [corA, corB] = VERDE.hera
    const ramos = alta ? 4 : 3

    for (let i = 0; i < ramos; i++) {
      const x0 = (i - (ramos - 1) / 2) * 0.16 + (rnd() - 0.5) * 0.07
      const alt = 0.42 + rnd() * 0.44
      const ramo = curva([
        [x0, 0, 0.012],
        [x0 + (rnd() - 0.5) * 0.16, alt * 0.32, 0.018],
        [x0 + (rnd() - 0.5) * 0.22, alt * 0.66, 0.014],
        [x0 + (rnd() - 0.5) * 0.26, alt, 0.02],
      ])
      put(out, 'stem', tubo(ramo, { r0: 0.0032, r1: 0.0014, radial: 5, segs: 16, corA: '#5a4a32', corB: '#7a6844' }))

      const n = alta ? 11 : 7
      for (let k = 1; k <= n; k++) {
        const t = k / (n + 0.3)
        const p = ramo.getPointAt(t)
        const lado = k % 2 === 0 ? 1 : -1
        folhaTresLobos(
          out,
          aim(
            [p.x + lado * 0.012, p.y, p.z + 0.006],
            // a folha cresce ao longo da parede (para o lado e para baixo) e
            // so um pouco para fora dela
            [lado * 0.62, -0.62 - rnd() * 0.25, 0.28],
            lado * (0.3 + rnd() * 0.4),
            // "para cima" da folha e a normal da parede: e o que a deita nela
            [0, 0, 1],
          ),
          {
            tamanho: (0.042 + rnd() * 0.018) * (1 - t * 0.28),
            segsU: alta ? 5 : 3,
            segsV: alta ? 3 : 2,
            corA,
            corB,
          },
        )
      }
    }
  },
}

// --- montagem -------------------------------------------------------------

/** Gerador pseudoaleatorio com semente: a mesma planta sai igual todo render. */
const semente = (n) => {
  let s = (n * 9301 + 49297) % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

const deslocar = (out, matriz) => {
  Object.values(out).forEach((lista) => lista.forEach((g) => g.applyMatrix4(matriz)))
}

/**
 * Peso do vento por vertice: distancia ate o vaso, normalizada.
 * Vai num atributo em vez de sair de `position.y` no shader porque o vaso
 * nem sempre esta em y=0 — na planta pendurada ele desceu o tamanho da corda,
 * e a folhagem cresce para BAIXO. Com a distancia ao vaso, o mesmo shader
 * serve para a costela de chao, para a hera na parede e para a pendurada.
 */
const pesoVento = (geo, yVaso) => {
  const pos = geo.attributes.position
  const arr = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    const dx = pos.getX(i)
    const dy = pos.getY(i) - yVaso
    const dz = pos.getZ(i)
    arr[i] = Math.min(1, Math.sqrt(dx * dx + dy * dy + dz * dz) / 0.55)
  }
  geo.setAttribute('aVento', new THREE.Float32BufferAttribute(arr, 1))
}

/**
 * Monta uma planta e devolve uma geometria por material.
 * @param {'costela'|'espada'|'samambaia'|'jiboia'|'suculenta'|'cacto'|'hera'} kind
 * @param {{alta?:boolean, seed?:number, hanging?:number, frente?:boolean,
 *   bracket?:boolean|{r?:number,alt?:number,comp?:number}, stand?:{h:number,r:number}}} opts
 */
export function buildPlant(kind, opts = {}) {
  const build = especies[kind] ?? especies.jiboia
  const out = emptyGroups()
  const rnd = semente(opts.seed ?? 7)
  build(out, { alta: opts.alta !== false, rnd, frente: opts.frente })

  // Pendurada: a planta desce o comprimento da corda e o macrame sobe do
  // vaso ate o gancho. A posicao na cena e o gancho, nao o vaso.
  if (opts.hanging) {
    deslocar(out, new THREE.Matrix4().makeTranslation(0, -opts.hanging, 0))
    // o raio vem do proprio vaso: com 0.082 fixo, a corda atravessava o
    // cachepo da samambaia e ficava solta no da jiboia
    const aro = out.pot.find((g) => g.userData.aro)?.userData.aro
    macrame(out, { queda: opts.hanging, rVaso: (aro?.r ?? 0.078) + 0.004 })
  }
  if (opts.bracket) suporteParede(out, typeof opts.bracket === 'object' ? opts.bracket : {})
  if (opts.stand) banquinho(out, opts.stand)

  const result = {}
  for (const [grupo, lista] of Object.entries(out)) {
    if (!lista.length) continue
    const merged = lista.length === 1 ? lista[0] : mergeGeometries(lista, false)
    if (lista.length > 1) lista.forEach((g) => g.dispose())
    // So folha e haste balancam. O atributo entra depois da mesclagem, senao
    // cada pedaco teria de trazer o seu e a mesclagem exige atributo igual.
    if (grupo === 'leaf' || grupo === 'stem') pesoVento(merged, -(opts.hanging ?? 0))
    merged.computeBoundingBox()
    merged.computeBoundingSphere()
    result[grupo] = merged
  }
  return result
}

export function disposePlant(built) {
  Object.values(built ?? {}).forEach((geo) => geo?.dispose?.())
}
