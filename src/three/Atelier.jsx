import { useMemo } from 'react'
import { ContactShadows } from '@react-three/drei'
import { room } from '../data/scene'
import { plasterTexture, signTexture, windowTexture, woodFloorTexture } from './textures'
import { roundedBox } from './shapes'

// Casco do ambiente. Tres paredes: fundo, esquerda inteira e um retorno curto
// na direita. A frente nao existe — e por ali que a camera olha.
//
// Duas decisoes que mudam como a cena le:
//
// 1. Parede e CAIXA, nao plano. Com espessura, a quina da abertura aparece, o
//    rodape tem onde encostar e a janela ganha um vao de 10 cm com peitoril.
//    Plano de espessura zero e o que fazia o comodo parecer papel dobrado.
//
// 2. A parede do fundo e montada em QUATRO paineis em volta da janela, em vez
//    de uma parede com um retangulo claro colado. O buraco e de verdade: a luz
//    do sol atravessa so ali, e a sombra que aparece na bancada e o proprio
//    caixilho projetado. Nada de mancha de luz pintada no chao.

const MADEIRA_ESCURA = '#6b4a34'

// Marca das paredes que a camera nao atravessa (lida pelo CameraRig). Teto e
// piso ficam de fora: a altura da camera e presa por conta, sem colisao, para
// o giro vertical nao virar um zoom brusco.
const COLISOR_CAMERA = { colisorCamera: true }

export function Atelier() {
  const floorMap = useMemo(() => woodFloorTexture(), [])
  const wallMap = useMemo(() => plasterTexture(), [])
  const signMap = useMemo(() => signTexture(), [])
  const winMap = useMemo(() => windowTexture(), [])

  const win = room.window
  const sign = room.sign
  const beam = room.beam

  // Medidas derivadas, todas uma vez: a parede do fundo cobre a espessura das
  // laterais, entao ela e mais larga que o vao interno do comodo.
  const W = room.halfW + room.wallT
  const zFundo = room.wallZ - room.wallT / 2
  const zTrasParede = room.wallZ - room.wallT

  const pisoFundo = room.floorFrontZ - zTrasParede
  const pisoZ = (room.floorFrontZ + zTrasParede) / 2
  const tetoFundo = room.leftFrontZ - zTrasParede
  const tetoZ = (room.leftFrontZ + zTrasParede) / 2

  const vaoEsq = win.x - win.w / 2
  const vaoDir = win.x + win.w / 2
  const vaoBase = win.y - win.h / 2
  const vaoTopo = win.y + win.h / 2

  return (
    <group>
      {/* --- piso e teto --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, pisoZ]} receiveShadow>
        <planeGeometry args={[W * 2, pisoFundo]} />
        <meshStandardMaterial map={floorMap} bumpMap={floorMap} bumpScale={0.35} roughness={0.72} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, room.wallH, tetoZ]}>
        <planeGeometry args={[W * 2, tetoFundo]} />
        <meshStandardMaterial color="#cbb79c" roughness={0.95} />
      </mesh>

      {/* --- paredes --- */}
      {/* fundo, em quatro paineis: a janela e um vao de verdade */}
      {[
        { w: vaoEsq + W, h: room.wallH, x: (vaoEsq - W) / 2, y: room.wallH / 2 },
        { w: W - vaoDir, h: room.wallH, x: (vaoDir + W) / 2, y: room.wallH / 2 },
        { w: win.w, h: room.wallH - vaoTopo, x: win.x, y: (vaoTopo + room.wallH) / 2 },
        { w: win.w, h: vaoBase, x: win.x, y: vaoBase / 2 },
      ].map((p, i) => (
        <mesh
          key={i}
          geometry={roundedBox(p.w, p.h, room.wallT, 0.006)}
          position={[p.x, p.y, zFundo]}
          userData={COLISOR_CAMERA}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial map={wallMap} bumpMap={wallMap} bumpScale={0.5} roughness={0.93} />
        </mesh>
      ))}

      {/* esquerda inteira e retorno curto na direita */}
      {[
        { x: -(room.halfW + room.wallT / 2), d: room.leftFrontZ - zTrasParede, z: (room.leftFrontZ + zTrasParede) / 2 },
        { x: room.halfW + room.wallT / 2, d: room.rightFrontZ - zTrasParede, z: (room.rightFrontZ + zTrasParede) / 2 },
      ].map((p, i) => (
        <mesh
          key={i}
          geometry={roundedBox(room.wallT, room.wallH, p.d, 0.006)}
          position={[p.x, room.wallH / 2, p.z]}
          userData={COLISOR_CAMERA}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial map={wallMap} bumpMap={wallMap} bumpScale={0.5} roughness={0.93} />
        </mesh>
      ))}

      {/* --- rodape e sanca: e o que da idade ao comodo --- */}
      {[
        { geo: [room.halfW * 2, 0.13, 0.028], pos: [0, 0.065, room.wallZ + 0.014] },
        { geo: [0.028, 0.13, room.leftFrontZ - room.wallZ], pos: [-room.halfW + 0.014, 0.065, (room.leftFrontZ + room.wallZ) / 2] },
        { geo: [0.028, 0.13, room.rightFrontZ - room.wallZ], pos: [room.halfW - 0.014, 0.065, (room.rightFrontZ + room.wallZ) / 2] },
      ].map((p, i) => (
        <mesh key={i} geometry={roundedBox(p.geo[0], p.geo[1], p.geo[2], 0.012)} position={p.pos} castShadow receiveShadow>
          <meshStandardMaterial color="#e6d8c0" roughness={0.62} />
        </mesh>
      ))}
      {[
        { geo: [room.halfW * 2, 0.075, 0.045], pos: [0, room.wallH - 0.04, room.wallZ + 0.022] },
        { geo: [0.045, 0.075, room.leftFrontZ - room.wallZ], pos: [-room.halfW + 0.022, room.wallH - 0.04, (room.leftFrontZ + room.wallZ) / 2] },
      ].map((p, i) => (
        <mesh key={i} geometry={roundedBox(p.geo[0], p.geo[1], p.geo[2], 0.014)} position={p.pos}>
          <meshStandardMaterial color="#e6d8c0" roughness={0.7} />
        </mesh>
      ))}

      {/* --- viga aparente: e dela que as plantas penduram --- */}
      <mesh
        geometry={roundedBox(room.halfW * 2, beam.h, beam.d, 0.016)}
        position={[0, beam.y, beam.z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={MADEIRA_ESCURA} bumpMap={floorMap} bumpScale={0.25} roughness={0.68} />
      </mesh>
      {[-1.28, 0.02, 1.32].map((x, i) => (
        <mesh
          key={i}
          geometry={roundedBox(0.05, room.wallH - beam.y - beam.h / 2, 0.05, 0.008)}
          position={[x, (room.wallH + beam.y + beam.h / 2) / 2, beam.z]}
        >
          <meshStandardMaterial color="#5c3f2d" roughness={0.72} />
        </mesh>
      ))}

      {/* --- janela --- */}
      {/* vidro no meio da espessura: o recuo de 6 cm e o que da o vao */}
      <mesh position={[win.x, win.y, room.wallZ - 0.045]}>
        <planeGeometry args={[win.w, win.h]} />
        <meshBasicMaterial map={winMap} toneMapped={false} />
      </mesh>

      {/* peitoril, avancando para dentro do comodo */}
      <mesh
        geometry={roundedBox(win.w + 0.13, 0.036, room.wallT + 0.07, 0.014)}
        position={[win.x, vaoBase - 0.018, room.wallZ - room.wallT / 2 + 0.035]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e6d8c0" roughness={0.6} />
      </mesh>

      {/* caixilho e travessas. Sao eles que desenham a cruz de sol na bancada,
          entao castShadow aqui nao e detalhe: e o efeito. */}
      {[
        { geo: [0.05, win.h + 0.07, 0.035], pos: [vaoEsq + 0.022, win.y, room.wallZ + 0.014] },
        { geo: [0.05, win.h + 0.07, 0.035], pos: [vaoDir - 0.022, win.y, room.wallZ + 0.014] },
        { geo: [win.w + 0.07, 0.05, 0.035], pos: [win.x, vaoTopo - 0.022, room.wallZ + 0.014] },
        { geo: [0.026, win.h, 0.026], pos: [win.x, win.y, room.wallZ + 0.008] },
        { geo: [win.w, 0.024, 0.024], pos: [win.x, win.y + win.h * 0.17, room.wallZ + 0.008] },
      ].map((p, i) => (
        <mesh key={i} geometry={roundedBox(p.geo[0], p.geo[1], p.geo[2], 0.006)} position={p.pos} castShadow>
          <meshStandardMaterial color="#8a6647" roughness={0.55} />
        </mesh>
      ))}

      {/* --- placa do ateliê: diz o nome do negocio dentro da propria cena --- */}
      <group position={[sign.x, sign.y, room.wallZ + 0.022]} rotation={[0, 0, -0.012]}>
        <mesh geometry={roundedBox(sign.w, sign.h, 0.026, 0.01)} castShadow receiveShadow>
          <meshStandardMaterial color="#7b4f3c" roughness={0.68} />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[sign.w - 0.024, sign.h - 0.024]} />
          <meshStandardMaterial map={signMap} roughness={0.7} />
        </mesh>
        {/* cordinha de onde ela pende */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.1, sign.h / 2 + 0.07, -0.006]} rotation={[0, 0, -s * 0.55]}>
            <cylinderGeometry args={[0.0022, 0.0022, 0.17, 6]} />
            <meshStandardMaterial color="#5f4a3a" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Oclusao de contato no piso, assada no primeiro quadro. O sol entra
          por um vao so: fora do facho nada ficaria apoiado no chao, tudo
          pareceria flutuar. `far` baixo para so o que esta perto do piso
          contar — planta pendurada nao pode escurecer o assoalho. */}
      <ContactShadows
        position={[0, 0.004, pisoZ]}
        scale={[W * 2, pisoFundo]}
        resolution={1024}
        far={1.15}
        blur={2.6}
        opacity={0.5}
        color="#2a1c12"
        frames={1}
      />
    </group>
  )
}
