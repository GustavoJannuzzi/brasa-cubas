import { useMemo } from 'react'
import * as THREE from 'three'
import { table } from '../data/scene'
import { useStore } from '../store/useStore'
import { CeramicPiece } from './CeramicPiece'
import { roundedBox, roundedCylinder } from './shapes'
import { matTexture, tableWoodTexture } from './textures'

const TOP = table.topY
// As pecas de cenario crescem um pouco menos que as da prateleira: aqui
// a mesa ja da referencia de tamanho, e exagerar deixaria a cena de brinquedo.
const DECOR_SCALE = 1.15

// Pecas de cenario da bancada: nao sao produtos, existem para a mesa
// parecer uma mesa de trabalho de verdade. A planta que ficava aqui saiu:
// virou suculenta de verdade em `plants` (data/scene.js).
const DECOR = {
  rolo: { kind: 'rolo', body: '#c9a06b', accent: '#8a5a44' },
  tigela: { kind: 'tigelaMassa', body: '#eadfcc', accent: '#e8a0a8' },
  pinceis: { kind: 'potePinceis', body: '#dcd0bb', accent: '#b8734a', leaf: '#6b5540' },
  caderno: { kind: 'caderno', body: '#f6efe2', accent: '#c2582d' },
  flores: { kind: 'floresSoltas', body: '#f2e7d5', accent: '#c9a227', petal: '#f0c3c6', leaf: '#8fa089' },
  potinho: { kind: 'potinho', body: '#e9dcc6', accent: '#8fa089' },
}

const METAL = { color: '#3f3a36', roughness: 0.4, metalness: 0.4 }

/**
 * Caixa invisivel que torna um objeto da bancada clicavel.
 *
 * A Ajuda promete "tocar direto no objeto tambem funciona", mas o telefone e o
 * caderno nao tinham area nenhuma: so o marcador flutuante abria o painel, e
 * quem tentava o gesto obvio — tocar na coisa — nao conseguia nada.
 */
function AreaClicavel({ position, args, rotation = [0, 0, 0], painel, nome }) {
  const openPanel = useStore((s) => s.openPanel)
  return (
    <mesh
      position={position}
      rotation={rotation}
      visible={false}
      name={nome}
      onClick={(e) => {
        // Mesmo limite de arrasto dos outros alvos da cena.
        if (e.delta > 6) return
        e.stopPropagation()
        openPanel(painel)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <boxGeometry args={args} />
    </mesh>
  )
}

// Perfil da cupula da lampada. Lathe e nao cone aberto: o cone de face unica
// desaparece quando a camera passa por tras dele, e a borda fica sem espessura.
const CUPULA = [
  [0.014, 0.1],
  [0.03, 0.07],
  [0.062, 0.016],
  [0.082, 0],
  [0.079, -0.004],
  [0.058, 0.014],
  [0.026, 0.066],
  [0.011, 0.098],
].map(([x, y]) => new THREE.Vector2(x, y))

function Lampada({ position }) {
  return (
    <group position={position}>
      <mesh geometry={roundedCylinder(0.062, 0.018, 0.008, 20)} castShadow>
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[0, 0.17, -0.02]} rotation={[0.12, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.009, 0.31, 10]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      {/* cupula: lathe em vez de cone aberto, para ter borda com espessura */}
      <mesh position={[0.02, 0.315, 0.06]} rotation={[0.85, 0, 0.2]} castShadow>
        <latheGeometry args={[CUPULA, 18]} />
        <meshStandardMaterial color="#c2582d" roughness={0.45} side={THREE.DoubleSide} />
      </mesh>
      {/* a luz da lampada: o ponto quente que puxa o olho para a bancada */}
      <pointLight position={[0.04, 0.29, 0.1]} intensity={0.5} distance={1.6} decay={2} color="#ffbe7a" />
      <mesh position={[0.035, 0.285, 0.095]}>
        <sphereGeometry args={[0.022, 12, 8]} />
        <meshBasicMaterial color="#ffe0b0" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Telefone({ position }) {
  const baquelite = { color: '#8a3a2a', roughness: 0.34 }
  return (
    <group position={position} rotation={[0, -0.35, 0]} scale={1.35}>
      <mesh geometry={roundedBox(0.125, 0.044, 0.1, 0.016)} position={[0, 0.022, 0]} castShadow>
        <meshStandardMaterial {...baquelite} />
      </mesh>
      <mesh position={[0, 0.046, -0.012]} rotation={[-0.3, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 20]} />
        <meshStandardMaterial color="#d9cdb8" roughness={0.5} />
      </mesh>
      {/* fone no gancho */}
      <mesh position={[0, 0.062, 0.012]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.013, 0.074, 3, 10]} />
        <meshStandardMaterial {...baquelite} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.058, 0.012]}>
          <sphereGeometry args={[0.019, 12, 8]} />
          <meshStandardMaterial {...baquelite} />
        </mesh>
      ))}
    </group>
  )
}

function Banqueta({ position }) {
  return (
    <group position={position}>
      <mesh geometry={roundedCylinder(0.16, 0.032, 0.012, 20)} position={[0, 0.44, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8a5a44" roughness={0.64} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh
            key={i}
            castShadow
            position={[Math.cos(a) * 0.1, 0.21, Math.sin(a) * 0.1]}
            rotation={[Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12]}
          >
            <cylinderGeometry args={[0.016, 0.02, 0.44, 10]} />
            <meshStandardMaterial color="#6f4a37" roughness={0.68} />
          </mesh>
        )
      })}
      {/* travessa entre os pes: e o que faz a banqueta parecer marcenaria */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 3
        return (
          <mesh key={`t${i}`} position={[Math.cos(a) * 0.075, 0.13, Math.sin(a) * 0.075]} rotation={[0, -a, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.15, 8]} />
            <meshStandardMaterial color="#6f4a37" roughness={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

export function WorkTable({ quality = 'alta' }) {
  const wood = useMemo(() => tableWoodTexture(), [])
  const mat = useMemo(() => matTexture(), [])
  const legH = TOP - table.thickness

  return (
    <group>
      {/* tampo: raio de 10 mm na quina. O tampo e a peca mais perto da camera
          na vista da bancada, e era a que mais entregava a caixa reta. */}
      <mesh
        geometry={roundedBox(table.halfW * 2, table.thickness, table.halfD * 2, 0.01)}
        position={[0, TOP - table.thickness / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial map={wood} bumpMap={wood} bumpScale={0.25} roughness={0.55} />
      </mesh>

      {/* pernas */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh
          key={i}
          geometry={roundedBox(0.072, legH, 0.072, 0.008)}
          position={[sx * (table.halfW - 0.1), legH / 2, sz * (table.halfD - 0.1)]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#7b5238" roughness={0.7} />
        </mesh>
      ))}

      {/* prateleira de baixo, com caixotes de material */}
      <mesh
        geometry={roundedBox(table.halfW * 2 - 0.22, 0.032, table.halfD * 2 - 0.34, 0.006)}
        position={[0, 0.22, -0.1]}
        receiveShadow
      >
        <meshStandardMaterial color="#6f4a37" roughness={0.74} />
      </mesh>
      {[
        { x: -0.6, color: '#b8734a' },
        { x: -0.2, color: '#8fa089' },
        { x: 0.52, color: '#c9a06b' },
      ].map((caixa, i) => (
        <group key={i} position={[caixa.x, 0.31, -0.12]}>
          <mesh geometry={roundedBox(0.32, 0.15, 0.26, 0.018)} castShadow receiveShadow>
            <meshStandardMaterial color={caixa.color} roughness={0.78} />
          </mesh>
          {/* boca do caixote um tom abaixo: da fundo e tira o ar de bloco */}
          <mesh position={[0, 0.076, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.28, 0.22]} />
            <meshStandardMaterial color="#5c4636" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* tapete de corte */}
      <mesh receiveShadow position={[-0.42, TOP + 0.003, 0.1]} rotation={[-Math.PI / 2, 0, 0.02]}>
        <planeGeometry args={[0.68, 0.46]} />
        <meshStandardMaterial map={mat} roughness={0.82} />
      </mesh>

      {/* --- o que esta sobre a mesa --- */}
      <CeramicPiece piece={DECOR.flores} position={[-0.42, TOP + 0.006, 0.08]} scale={DECOR_SCALE} quality={quality} />
      <CeramicPiece
        piece={DECOR.rolo}
        position={[-0.8, TOP + 0.027 * DECOR_SCALE, 0.3]}
        rotation={[0, 0.22, 0]}
        scale={DECOR_SCALE}
        quality={quality}
      />
      <CeramicPiece piece={DECOR.tigela} position={[-0.1, TOP, -0.22]} scale={DECOR_SCALE} quality={quality} />
      <CeramicPiece piece={DECOR.pinceis} position={[0.16, TOP, -0.34]} scale={DECOR_SCALE} quality={quality} />
      <CeramicPiece piece={DECOR.caderno} position={[0.38, TOP, 0.14]} rotation={[0, -0.14, 0]} scale={DECOR_SCALE} quality={quality} />
      <CeramicPiece piece={DECOR.potinho} position={[0.86, TOP, 0.28]} scale={DECOR_SCALE} quality={quality} />

      <Lampada position={[-0.94, TOP, -0.28]} />
      <Telefone position={[0.6, TOP, -0.32]} />
      <Banqueta position={[-0.2, 0, 0.9]} />

      {/* O telefone abre o contato e o caderno abre o orcamento — os mesmos
          destinos dos marcadores que flutuam sobre eles. */}
      <AreaClicavel
        position={[0.6, TOP + 0.05, -0.32]}
        args={[0.2, 0.13, 0.17]}
        painel="contato"
        nome="area-telefone"
      />
      <AreaClicavel
        position={[0.38, TOP + 0.03, 0.14]}
        args={[0.26, 0.08, 0.2]}
        rotation={[0, -0.14, 0]}
        painel="orcamento"
        nome="area-caderno"
      />
    </group>
  )
}
