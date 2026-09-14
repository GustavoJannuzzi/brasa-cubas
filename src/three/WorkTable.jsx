import { useMemo } from 'react'
import { table } from '../data/scene'
import { CeramicPiece } from './CeramicPiece'
import { matTexture, tableWoodTexture } from './textures'

const TOP = table.topY
// As pecas de cenario crescem um pouco menos que as da prateleira: aqui
// a mesa ja da referencia de tamanho, e exagerar deixaria a cena de brinquedo.
const DECOR_SCALE = 1.15

// Pecas de cenario da bancada: nao sao produtos, existem para a mesa
// parecer uma mesa de trabalho de verdade.
const DECOR = {
  rolo: { kind: 'rolo', body: '#c9a06b', accent: '#8a5a44' },
  tigela: { kind: 'tigelaMassa', body: '#eadfcc', accent: '#e8a0a8' },
  pinceis: { kind: 'potePinceis', body: '#dcd0bb', accent: '#b8734a', leaf: '#6b5540' },
  caderno: { kind: 'caderno', body: '#f6efe2', accent: '#c2582d' },
  flores: { kind: 'floresSoltas', body: '#f2e7d5', accent: '#c9a227', petal: '#f0c3c6', leaf: '#8fa089' },
  planta: { kind: 'planta', body: '#c98b5e', accent: '#4a3b2a', leaf: '#7e9078' },
  potinho: { kind: 'potinho', body: '#e9dcc6', accent: '#8fa089' },
}

function Lampada({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.008, 0]}>
        <cylinderGeometry args={[0.058, 0.062, 0.016, 20]} />
        <meshStandardMaterial color="#3f3a36" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0, 0.16, -0.02]} rotation={[0.12, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 10]} />
        <meshStandardMaterial color="#3f3a36" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh castShadow position={[0.02, 0.315, 0.06]} rotation={[0.85, 0, 0.2]}>
        <coneGeometry args={[0.08, 0.1, 18, 1, true]} />
        <meshStandardMaterial color="#c2582d" roughness={0.5} side={2} />
      </mesh>
      {/* a luz da lampada: o ponto quente que puxa o olho para a bancada */}
      <pointLight position={[0.04, 0.29, 0.1]} intensity={0.45} distance={1.5} decay={2} color="#ffbe7a" />
      <mesh position={[0.035, 0.285, 0.095]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshBasicMaterial color="#ffe0b0" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Telefone({ position }) {
  return (
    <group position={position} rotation={[0, -0.35, 0]} scale={1.35}>
      <mesh castShadow position={[0, 0.022, 0]}>
        <boxGeometry args={[0.125, 0.044, 0.1]} />
        <meshStandardMaterial color="#8a3a2a" roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.046, -0.012]} rotation={[-0.3, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.006, 20]} />
        <meshStandardMaterial color="#d9cdb8" roughness={0.5} />
      </mesh>
      {/* fone no gancho */}
      <mesh castShadow position={[0, 0.062, 0.012]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.013, 0.1, 12]} />
        <meshStandardMaterial color="#8a3a2a" roughness={0.38} />
      </mesh>
      <mesh position={[-0.05, 0.058, 0.012]}>
        <sphereGeometry args={[0.019, 10, 8]} />
        <meshStandardMaterial color="#8a3a2a" roughness={0.38} />
      </mesh>
      <mesh position={[0.05, 0.058, 0.012]}>
        <sphereGeometry args={[0.019, 10, 8]} />
        <meshStandardMaterial color="#8a3a2a" roughness={0.38} />
      </mesh>
    </group>
  )
}

function Banqueta({ position }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 18]} />
        <meshStandardMaterial color="#8a5a44" roughness={0.68} />
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
            <cylinderGeometry args={[0.016, 0.02, 0.44, 8]} />
            <meshStandardMaterial color="#6f4a37" roughness={0.7} />
          </mesh>
        )
      })}
    </group>
  )
}

export function WorkTable() {
  const wood = useMemo(() => tableWoodTexture(), [])
  const mat = useMemo(() => matTexture(), [])
  const legH = TOP - table.thickness

  return (
    <group>
      {/* tampo */}
      <mesh castShadow receiveShadow position={[0, TOP - table.thickness / 2, 0]}>
        <boxGeometry args={[table.halfW * 2, table.thickness, table.halfD * 2]} />
        <meshStandardMaterial map={wood} roughness={0.62} />
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
          castShadow
          position={[sx * (table.halfW - 0.1), legH / 2, sz * (table.halfD - 0.1)]}
        >
          <boxGeometry args={[0.07, legH, 0.07]} />
          <meshStandardMaterial color="#7b5238" roughness={0.72} />
        </mesh>
      ))}

      {/* travessa e prateleira de baixo, com caixas de material */}
      <mesh receiveShadow position={[0, 0.22, -0.1]}>
        <boxGeometry args={[table.halfW * 2 - 0.22, 0.03, table.halfD * 2 - 0.34]} />
        <meshStandardMaterial color="#6f4a37" roughness={0.75} />
      </mesh>
      {[
        { x: -0.6, color: '#b8734a' },
        { x: -0.2, color: '#8fa089' },
        { x: 0.52, color: '#c9a06b' },
      ].map((box, i) => (
        <mesh key={i} castShadow position={[box.x, 0.31, -0.12]}>
          <boxGeometry args={[0.32, 0.15, 0.26]} />
          <meshStandardMaterial color={box.color} roughness={0.8} />
        </mesh>
      ))}

      {/* tapete de corte */}
      <mesh receiveShadow position={[-0.42, TOP + 0.003, 0.1]} rotation={[-Math.PI / 2, 0, 0.02]}>
        <planeGeometry args={[0.68, 0.46]} />
        <meshStandardMaterial map={mat} roughness={0.85} />
      </mesh>

      {/* --- o que esta sobre a mesa --- */}
      <CeramicPiece piece={DECOR.flores} position={[-0.42, TOP + 0.006, 0.08]} scale={DECOR_SCALE} />
      <CeramicPiece
        piece={DECOR.rolo}
        position={[-0.8, TOP + 0.027 * DECOR_SCALE, 0.3]}
        rotation={[0, 0.22, 0]}
        scale={DECOR_SCALE}
      />
      <CeramicPiece piece={DECOR.tigela} position={[-0.1, TOP, -0.22]} scale={DECOR_SCALE} />
      <CeramicPiece piece={DECOR.pinceis} position={[0.16, TOP, -0.34]} scale={DECOR_SCALE} />
      <CeramicPiece piece={DECOR.caderno} position={[0.38, TOP, 0.14]} rotation={[0, -0.14, 0]} scale={DECOR_SCALE} />
      <CeramicPiece piece={DECOR.potinho} position={[0.86, TOP, 0.28]} scale={DECOR_SCALE} />
      <CeramicPiece piece={DECOR.planta} position={[1.0, TOP, -0.08]} scale={DECOR_SCALE} />

      <Lampada position={[-0.94, TOP, -0.28]} />
      <Telefone position={[0.6, TOP, -0.32]} />
      <Banqueta position={[-0.2, 0, 0.9]} />
    </group>
  )
}
