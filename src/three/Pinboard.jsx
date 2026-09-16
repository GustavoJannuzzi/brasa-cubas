import { useMemo } from 'react'
import { gallery } from '../data/products'
import { room } from '../data/scene'
import { useStore } from '../store/useStore'
import { roundedBox } from './shapes'
import { corkTexture } from './textures'

// Mural de cortica na parede da esquerda, com as fotos dos projetos entregues.
// As "fotos" sao retangulos de cor: quando houver imagens de verdade,
// basta trocar o material por um <meshBasicMaterial map={...} />.
export function Pinboard() {
  const cork = useMemo(() => corkTexture(), [])
  const openPanel = useStore((s) => s.openPanel)

  const layout = useMemo(
    () =>
      gallery.slice(0, 6).map((item, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        return {
          ...item,
          x: -0.36 + col * 0.36,
          y: 0.16 - row * 0.32,
          tilt: (i % 2 === 0 ? 1 : -1) * (2 + (i % 3)) * (Math.PI / 180),
        }
      }),
    [],
  )

  return (
    <group position={[-room.halfW + 0.03, 1.5, -0.9]} rotation={[0, Math.PI / 2, 0]}>
      {/* moldura: caixa de canto arredondado, com a cortica recuada dentro */}
      <mesh geometry={roundedBox(1.24, 0.84, 0.032, 0.012)} castShadow receiveShadow>
        <meshStandardMaterial color="#8a6647" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.018]} receiveShadow>
        <planeGeometry args={[1.16, 0.76]} />
        <meshStandardMaterial map={cork} bumpMap={cork} bumpScale={0.4} roughness={0.88} />
      </mesh>

      {layout.map((item) => (
        <group
          key={item.id}
          position={[item.x, item.y, 0.021]}
          rotation={[0, 0, item.tilt]}
          onClick={(e) => {
            // Arrasto que comeca em cima de uma foto e giro de camera, nao
            // clique na foto.
            if (e.delta > 6) return
            e.stopPropagation()
            openPanel('galeria')
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          {/* papel com espessura: a foto projeta sombrinha na cortica */}
          <mesh geometry={roundedBox(0.26, 0.28, 0.004, 0.003)} castShadow>
            <meshStandardMaterial color="#fbf8f2" roughness={0.82} />
          </mesh>
          {/* imagem */}
          <mesh position={[0, 0.018, 0.003]}>
            <planeGeometry args={[0.22, 0.2]} />
            <meshStandardMaterial color={item.palette[0]} roughness={0.68} />
          </mesh>
          <mesh position={[0.055, -0.022, 0.004]}>
            <planeGeometry args={[0.11, 0.055]} />
            <meshStandardMaterial color={item.palette[1]} roughness={0.68} />
          </mesh>
          {/* alfinete */}
          <mesh position={[0, 0.12, 0.012]} castShadow>
            <sphereGeometry args={[0.009, 12, 8]} />
            <meshStandardMaterial color="#c2582d" roughness={0.28} metalness={0.2} />
          </mesh>
        </group>
      ))}

      {/* fita de papel com a palavra do ateliê, so para dar vida ao mural */}
      <mesh position={[0.45, -0.28, 0.021]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[0.2, 0.07]} />
        <meshStandardMaterial color="#e8dccb" roughness={0.82} />
      </mesh>
    </group>
  )
}
