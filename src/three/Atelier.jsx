import { useMemo } from 'react'
import { room } from '../data/scene'
import { plasterTexture, signTexture, windowTexture, woodFloorTexture } from './textures'

// Casco do ambiente: piso, duas paredes e a janela.
// E um diorama — a frente e a direita ficam abertas, para a camera entrar.
export function Atelier() {
  const floorMap = useMemo(() => woodFloorTexture(), [])
  const wallMap = useMemo(() => plasterTexture(), [])
  const signMap = useMemo(() => signTexture(), [])
  const winMap = useMemo(() => windowTexture(), [])
  const win = room.window
  const sign = room.sign

  return (
    <group>
      {/* piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.4]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial map={floorMap} roughness={0.78} />
      </mesh>

      {/* teto: existe para a camera poder afastar em tela em pe sem
          deixar o vazio aparecer acima da parede */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, room.wallH, -0.3]}>
        <planeGeometry args={[7, 5]} />
        <meshStandardMaterial color="#d8c9b4" roughness={0.95} />
      </mesh>

      {/* parede do fundo */}
      <mesh position={[0, room.wallH / 2, room.wallZ]} receiveShadow>
        <planeGeometry args={[room.backHalfW * 2, room.wallH]} />
        <meshStandardMaterial map={wallMap} roughness={0.92} />
      </mesh>

      {/* parede da esquerda */}
      <mesh
        position={[room.leftWallX, room.wallH / 2, room.leftWallCenterZ]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <planeGeometry args={[room.leftWallSpan, room.wallH]} />
        <meshStandardMaterial map={wallMap} roughness={0.92} />
      </mesh>

      {/* rodape */}
      <mesh position={[0, 0.055, room.wallZ + 0.02]}>
        <boxGeometry args={[room.backHalfW * 2, 0.11, 0.04]} />
        <meshStandardMaterial color="#e3d8c6" roughness={0.7} />
      </mesh>
      <mesh position={[room.leftWallX + 0.02, 0.055, room.leftWallCenterZ]}>
        <boxGeometry args={[0.04, 0.11, room.leftWallSpan]} />
        <meshStandardMaterial color="#e3d8c6" roughness={0.7} />
      </mesh>

      {/* janela: o vidro estourado de luz e o que cria a sensacao de tarde */}
      <group position={[win.x, win.y, room.wallZ + 0.012]}>
        <mesh>
          <planeGeometry args={[win.w, win.h]} />
          <meshBasicMaterial map={winMap} toneMapped={false} />
        </mesh>
        {/* caixilho */}
        <mesh position={[0, 0, 0.008]}>
          <boxGeometry args={[win.w + 0.07, 0.035, 0.03]} />
          <meshStandardMaterial color="#8a6647" roughness={0.6} />
        </mesh>
        <mesh position={[0, win.h / 2 + 0.025, 0.008]}>
          <boxGeometry args={[win.w + 0.12, 0.05, 0.045]} />
          <meshStandardMaterial color="#8a6647" roughness={0.6} />
        </mesh>
        <mesh position={[0, -win.h / 2 - 0.03, 0.008]}>
          <boxGeometry args={[win.w + 0.12, 0.06, 0.07]} />
          <meshStandardMaterial color="#8a6647" roughness={0.6} />
        </mesh>
        <mesh position={[-win.w / 2 - 0.025, 0, 0.008]}>
          <boxGeometry args={[0.05, win.h + 0.11, 0.045]} />
          <meshStandardMaterial color="#8a6647" roughness={0.6} />
        </mesh>
        <mesh position={[win.w / 2 + 0.025, 0, 0.008]}>
          <boxGeometry args={[0.05, win.h + 0.11, 0.045]} />
          <meshStandardMaterial color="#8a6647" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[0.025, win.h, 0.02]} />
          <meshStandardMaterial color="#8a6647" roughness={0.6} />
        </mesh>
      </group>

      {/* placa do ateliê: diz o nome do negocio dentro da propria cena */}
      <group position={[sign.x, sign.y, room.wallZ + 0.02]} rotation={[0, 0, -0.012]}>
        <mesh castShadow>
          <boxGeometry args={[sign.w, sign.h, 0.022]} />
          <meshStandardMaterial color="#7b4f3c" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.013]}>
          <planeGeometry args={[sign.w - 0.02, sign.h - 0.02]} />
          <meshStandardMaterial map={signMap} roughness={0.72} />
        </mesh>
        {/* cordinha de onde ela pende */}
        <mesh position={[-0.1, sign.h / 2 + 0.07, -0.004]} rotation={[0, 0, 0.55]}>
          <boxGeometry args={[0.004, 0.17, 0.004]} />
          <meshStandardMaterial color="#5f4a3a" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, sign.h / 2 + 0.07, -0.004]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.004, 0.17, 0.004]} />
          <meshStandardMaterial color="#5f4a3a" roughness={0.9} />
        </mesh>
      </group>

      {/* mancha de luz da janela no chao */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[win.x - 0.3, 0.004, -0.5]}>
        <planeGeometry args={[0.8, 1.2]} />
        <meshBasicMaterial color="#ffe9c4" transparent opacity={0.13} toneMapped={false} />
      </mesh>
    </group>
  )
}
