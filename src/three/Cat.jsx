import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { gato } from '../data/scene'
import { useReducedMotion } from '../hooks/useMedia'
import { roundedBox, roundedCylinder } from './shapes'
import { tableWoodTexture } from './textures'

// O gato do atelie: arranha o poste, da uma volta, sobe, descansa, desce.
// Mesmo vocabulario do resto da cena — nada de modelo externo, tudo montado com
// as primitivas de `shapes` e a madeira da casa.
//
// POR QUE ELE MORA NUM ARRANHADOR: medido com marcadores nas duas larguras, um
// bicho de 24 cm solto no chao NAO entra no quadro de abertura — nem em 375 nem
// em 1440, porque a bancada (tampo 0.78) corta a linha de visada. O mesmo ponto
// com 70 cm entra nas duas. Aqui quem decide e a altura, como foi com a costela
// do fundo.
//
// O QUE O CHAO NAO MOSTRA: arranhar e dar a volta acontecem no chao, e no
// quadro de abertura isso fica ATRAS da bancada e do abajur. Medido olhando,
// tres quadros a 5 s de distancia em 1440: o gato apareceu em UM so, o do
// descanso no topo. A sonda de marcador dizia que o ponto de chao estava "em
// quadro" — e estava, dentro do retangulo da tela; so que "em quadro" nao e
// "visivel": ela nao testava se a bancada tapava. Por isso o descanso no topo
// e a fase LONGA do ciclo, e o poste e alto.
//
// CUSTO: a primeira versao tinha uma malha por pedaco, cada uma com material
// proprio, e custou +15 chamadas por quadro (medido A/B, com o mapa de sombra
// congelado: 162 -> 177 no celular, +9,3%). Triangulo era irrelevante (+2.716).
// A casa evita isso em todo lugar — uma planta inteira sai em 4 ou 5 chamadas
// porque a geometria e mesclada por material e a cor vai em vertex color. Aqui
// e igual: o corpo inteiro e UMA geometria, e so fica separado o que se mexe
// sozinho (o rabo). Sao 5 chamadas.
//
// SOMBRA: o gato NAO projeta, de proposito. `Sombra` (Experience) congela o mapa
// depois de 45 quadros, e o contrato da cena e "quem mexe pede" (o needsUpdate
// do useFrame de CeramicPiece). Mas aquele contrato so funciona porque o lerp da
// peca CONVERGE e ela para de pedir. Um gato em ciclo nunca converge: deixaria o
// mapa descongelado para sempre, a 287 chamadas e 243 mil triangulos por quadro
// contra 108 e 68 mil. No lugar, uma mancha de contato que anda com ele. O
// arranhador, que e estatico, projeta normalmente.

const COR = {
  pelo: '#6b5a4e',
  claro: '#e8dccb',
  // O unico respingo de brasa no bicho, e pequeno: o gato nao pode competir com
  // os marcadores da cena.
  focinho: '#c2582d',
  olho: '#2b2320',
  sisal: '#c9a875',
}

// A altura do topo (~0.91) nao e estetica. Com 0.68 o gato empoleirado ficava
// logo acima do tampo (0.78) no desktop, mas no celular caia ATRAS do chip
// "Como e feito" — medido na captura de 375. Mais alto, ele sobe acima do chip
// na tela pequena e fica mais longe da linha da bancada na grande.
const BASE = { l: 0.34, a: 0.03, p: 0.34 }
const COLUNA = { r: 0.055, a: 0.85 }
const TOPO = { l: 0.28, a: 0.028, p: 0.28 }
const ALTURA_DO_TOPO = BASE.a + COLUNA.a + TOPO.a

// --- ciclo --------------------------------------------------------------------
// O descanso no topo e a fase longa de proposito: e a unica em que o gato
// aparece no quadro de abertura (ver o comentario do topo). Antes eram 5 s de
// 16 (~31% do tempo visivel); agora 11 de ~19 (~58%).
const DUR = { arranhar: 2.5, volta: 4.5, subir: 0.6, descansar: 11.0, descer: 0.6 }
const ORDEM = ['arranhar', 'volta', 'subir', 'descansar', 'descer']
const CICLO = ORDEM.reduce((soma, f) => soma + DUR[f], 0)
const RAIO_DA_VOLTA = 0.24
// Em pe contra o poste: o bicho olha para +x, entao fica do lado -x dele.
const ARRANHO = { x: -0.22, ergue: 0.07, inclina: 0.55 }
const ALTURA_DO_PULO = 0.18

// Um enfeite nao pode comer o toque de algo que esteja atras dele.
const semClique = () => null
const embrulhar = (a) => Math.atan2(Math.sin(a), Math.cos(a))
const suave = THREE.MathUtils.smoothstep

const em = (x, y, z, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)).setPosition(x, y, z)

const pintarCor = (geo, cor) => {
  const c = new THREE.Color(cor)
  const n = geo.attributes.position.count
  const cores = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    cores[i * 3] = c.r
    cores[i * 3 + 1] = c.g
    cores[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cores, 3))
  return geo
}

// Duas funcoes de proposito, e o nome carrega o aviso.
// `copiaPintada` e para geometria CACHEADA de `shapes`: ela e dividida com a
// bancada e as prateleiras, e pintar ou mover o original estragaria a cena
// inteira. Por isso copia antes — para uma BufferGeometry crua: `clone()` faz
// `new this.constructor()`, que numa RoundedBoxGeometry monta uma caixa padrao
// inteira so para jogar fora (ver `add` em pieceGeometry.js).
// `pintarNova` e para geometria criada aqui mesmo, que ninguem mais usa.
const copiar = (cacheada) => new THREE.BufferGeometry().copy(cacheada)
const copiaPintada = (cacheada, cor, matriz) => {
  const geo = copiar(cacheada)
  if (matriz) geo.applyMatrix4(matriz)
  return pintarCor(geo, cor)
}
const pintarNova = (nova, cor, matriz) => {
  if (matriz) nova.applyMatrix4(matriz)
  return pintarCor(nova, cor)
}

// `mergeGeometries` devolve `null` quando as partes nao batem, e avisa so no
// console. `null` calado ja passou por "tudo certo" uma vez neste projeto; aqui
// ele vira erro com nome — e quem segura e o proprio `Gato`, nao o Boundary3D
// (ver o useMemo la embaixo: o Boundary3D derrubava o atelie inteiro).
const mesclar = (partes, oQue) => {
  // Tudo sem indice antes de mesclar. `RoundedBoxGeometry` sai SEM indice — o
  // proprio three chama `toNonIndexed()` e zera o `index` no construtor —,
  // enquanto Cone e Sphere saem COM. `mergeGeometries` recusa a mistura, e foi
  // isso que derrubou a primeira montagem: "failed with geometry at index 3", a
  // orelha, primeiro cone depois de tres roundedBox.
  const planas = partes.map((p) => {
    if (!p.index) return p
    const plana = p.toNonIndexed()
    p.dispose()
    return plana
  })
  const geo = mergeGeometries(planas, false)
  planas.forEach((p) => p.dispose())
  if (!geo) throw new Error(`Cat.jsx: mergeGeometries recusou "${oQue}" — as partes nao tem os mesmos atributos`)
  geo.computeBoundingSphere()
  return geo
}

function construir() {
  // Origem do corpo na PATA, olhando para +x: assim o bicho pousa em qualquer
  // superficie so dizendo a altura dela.
  const corpo = mesclar(
    [
      copiaPintada(roundedBox(0.3, 0.15, 0.16, 0.065), COR.pelo, em(0, 0.075, 0)),
      copiaPintada(roundedBox(0.1, 0.1, 0.11, 0.045), COR.claro, em(0.11, 0.085, 0)),
      copiaPintada(roundedBox(0.13, 0.12, 0.12, 0.05), COR.pelo, em(0.12, 0.185, 0)),
      pintarNova(new THREE.ConeGeometry(0.028, 0.055, 4), COR.pelo, em(0.1, 0.26, 0.04, 0.12, 0, -0.12)),
      pintarNova(new THREE.ConeGeometry(0.028, 0.055, 4), COR.pelo, em(0.1, 0.26, -0.04, -0.12, 0, -0.12)),
      pintarNova(new THREE.SphereGeometry(0.016, 8, 6), COR.focinho, em(0.185, 0.17, 0)),
      pintarNova(new THREE.SphereGeometry(0.011, 8, 6), COR.olho, em(0.175, 0.21, 0.035)),
      pintarNova(new THREE.SphereGeometry(0.011, 8, 6), COR.olho, em(0.175, 0.21, -0.035)),
      copiaPintada(roundedBox(0.075, 0.035, 0.05, 0.016), COR.claro, em(0.14, 0.018, 0.04)),
      copiaPintada(roundedBox(0.075, 0.035, 0.05, 0.016), COR.claro, em(0.14, 0.018, -0.04)),
    ],
    'corpo do gato',
  )

  // Pivo na BASE do rabo, para abanar girando em volta dela.
  const rabo = mesclar(
    [
      copiaPintada(roundedCylinder(0.019, 0.17, 0.012, 10), COR.pelo),
      copiaPintada(roundedCylinder(0.016, 0.09, 0.012, 10), COR.claro, em(0, 0.16, 0)),
    ],
    'rabo do gato',
  )

  // Madeira sem vertex color: o material usa a textura da bancada.
  const madeira = mesclar(
    [
      copiar(roundedBox(BASE.l, BASE.a, BASE.p, 0.008)).applyMatrix4(em(0, BASE.a / 2, 0)),
      copiar(roundedBox(TOPO.l, TOPO.a, TOPO.p, 0.008)).applyMatrix4(em(0, BASE.a + COLUNA.a + TOPO.a / 2, 0)),
    ],
    'madeira do arranhador',
  )

  const mancha = new THREE.CircleGeometry(0.13, 20)
  mancha.rotateX(-Math.PI / 2)

  return { corpo, rabo, madeira, mancha }
}

export function Gato() {
  const reduzida = useReducedMotion()
  // Enfeite nao pode derrubar o atelie. Na primeira montagem um erro aqui subiu
  // ate o Boundary3D, que troca o Canvas INTEIRO pelo aviso: o gato quebrado
  // levou junto a bancada, a estante e o mural (medido: `temCanvas: false`,
  // `gl: "perdido"`). Agora o erro sai com nome no console e so o gato some.
  const geo = useMemo(() => {
    try {
      return construir()
    } catch (erro) {
      console.error(erro)
      return null
    }
  }, [])
  const mat = useMemo(
    () => ({
      // Uma so rugosidade para o corpo inteiro: o olho perde um pouco de brilho
      // em troca de 10 chamadas a menos. Nesta distancia nao se ve a diferenca.
      corpo: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }),
      madeira: new THREE.MeshStandardMaterial({ map: tableWoodTexture(), roughness: 0.7 }),
      sisal: new THREE.MeshStandardMaterial({ color: COR.sisal, roughness: 0.95 }),
      mancha: new THREE.MeshBasicMaterial({ color: '#1c1512', transparent: true, opacity: 0.3, depthWrite: false }),
    }),
    [],
  )

  // A textura da madeira fica: e do cache de `textures`, dividida com a bancada.
  useEffect(
    () => () => {
      if (geo) Object.values(geo).forEach((g) => g.dispose())
      Object.values(mat).forEach((m) => m.dispose())
    },
    [geo, mat],
  )

  const bicho = useRef(null)
  const inclina = useRef(null)
  const abana = useRef(null)
  const mancha = useRef(null)
  const relogio = useRef(0)

  // Movimento reduzido: sentado no topo, parado. E a pose mais visivel que foi
  // medida, e e a mesma do descanso do ciclo — quem pede menos movimento ve o
  // mesmo gato, so que quieto.
  useEffect(() => {
    if (!reduzida) return
    if (bicho.current) {
      bicho.current.position.set(0, ALTURA_DO_TOPO, 0)
      bicho.current.rotation.y = 0
    }
    if (inclina.current) inclina.current.rotation.z = 0
    if (abana.current) abana.current.rotation.y = 0
    if (mancha.current) mancha.current.visible = false
  }, [reduzida])

  useFrame((_, delta) => {
    if (reduzida || !geo || !bicho.current) return
    // Aba que volta traz um delta enorme; sem o teto o gato teletransporta.
    const dt = Math.min(delta, 0.1)
    relogio.current = (relogio.current + dt) % CICLO

    let t = relogio.current
    let fase = ORDEM[ORDEM.length - 1]
    for (const f of ORDEM) {
      if (t < DUR[f]) {
        fase = f
        break
      }
      t -= DUR[f]
    }
    const s = t / DUR[fase]

    let x = 0
    let y = 0
    let z = 0
    let rumo = 0
    let nariz = 0
    let rabo = 0
    let noChao = false

    if (fase === 'arranhar') {
      // Ergue no comeco e baixa no fim, para nao dar tranco na troca de fase.
      const firme = suave(s, 0, 0.15) * (1 - suave(s, 0.85, 1))
      x = ARRANHO.x
      y = ARRANHO.ergue * firme + 0.012 * firme * Math.sin(relogio.current * Math.PI * 7)
      rumo = 0
      nariz = ARRANHO.inclina * firme
      rabo = 0.25 * Math.sin(relogio.current * 9)
      noChao = true
    } else if (fase === 'volta') {
      const theta = Math.PI + s * Math.PI * 2
      x = RAIO_DA_VOLTA * Math.cos(theta)
      z = RAIO_DA_VOLTA * Math.sin(theta)
      y = 0.008 * Math.abs(Math.sin(relogio.current * Math.PI * 4.4))
      // Tangente no sentido anti-horario; o bicho olha para +x no espaco local.
      rumo = Math.atan2(-Math.cos(theta), -Math.sin(theta))
      rabo = 0.5 * Math.sin(relogio.current * 5)
      noChao = true
    } else if (fase === 'subir') {
      x = THREE.MathUtils.lerp(-RAIO_DA_VOLTA, 0, s)
      y = THREE.MathUtils.lerp(0, ALTURA_DO_TOPO, s) + ALTURA_DO_PULO * Math.sin(Math.PI * s)
      rumo = 0
      nariz = 0.4 * Math.sin(Math.PI * s)
    } else if (fase === 'descansar') {
      y = ALTURA_DO_TOPO + 0.003 * Math.sin(relogio.current * 2)
      rumo = 0
      rabo = 0.35 * Math.sin(relogio.current * 2.2)
    } else {
      // descer: salta de costas para o poste e vira para ele ja no chao.
      x = THREE.MathUtils.lerp(0, ARRANHO.x, s)
      y = THREE.MathUtils.lerp(ALTURA_DO_TOPO, 0, s) + ALTURA_DO_PULO * Math.sin(Math.PI * s)
      rumo = Math.PI
      nariz = -0.4 * Math.sin(Math.PI * s)
    }

    bicho.current.position.set(x, y, z)
    // Rumo e inclinacao vao suavizados: sem isso a troca de fase vira giro seco.
    const giro = bicho.current.rotation.y
    bicho.current.rotation.y = giro + embrulhar(rumo - giro) * Math.min(1, dt * 9)
    inclina.current.rotation.z += (nariz - inclina.current.rotation.z) * Math.min(1, dt * 10)
    abana.current.rotation.y = rabo

    mancha.current.visible = noChao
    if (noChao) mancha.current.position.set(x, 0.002, z)
  })

  // Depois de TODOS os hooks, nunca antes: a ordem deles nao pode mudar entre
  // renderizacoes.
  if (!geo) return null

  const [px, py, pz] = gato.arranhador

  // `name` e para medir: a sonda acha este grupo, le o custo do quadro com ele
  // visivel e escondido, e a diferenca e o que o gato custa por quadro.
  return (
    <group name="gato" position={[px, py, pz]} rotation={[0, gato.giro, 0]}>
      <mesh geometry={geo.madeira} material={mat.madeira} castShadow receiveShadow raycast={semClique} />
      <mesh
        geometry={roundedCylinder(COLUNA.r, COLUNA.a, 0.01)}
        material={mat.sisal}
        position={[0, BASE.a, 0]}
        castShadow
        receiveShadow
        raycast={semClique}
      />
      <mesh ref={mancha} geometry={geo.mancha} material={mat.mancha} visible={false} raycast={semClique} />

      {/* Nasce na pose de descanso: com movimento reduzido ele fica aqui, e sem
          ele o primeiro quadro nao pisca numa posicao qualquer. */}
      <group ref={bicho} position={[0, ALTURA_DO_TOPO, 0]}>
        <group ref={inclina}>
          <mesh geometry={geo.corpo} material={mat.corpo} receiveShadow raycast={semClique} />
          <group ref={abana} position={[-0.15, 0.1, 0]}>
            {/* inclina o rabo para tras e para cima; quem abana e o grupo de fora */}
            <group rotation={[0, 0, 0.9]}>
              <mesh geometry={geo.rabo} material={mat.corpo} raycast={semClique} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
