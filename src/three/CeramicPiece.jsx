import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildPiece, disposePiece, pieceHeight, pieceRadius } from './pieceGeometry'

const GROUP_MATERIAL = {
  body: { key: 'body', roughness: 0.6 },
  accent: { key: 'accent', roughness: 0.42 },
  petal: { key: 'petal', roughness: 0.52 },
  leaf: { key: 'leaf', roughness: 0.72 },
  center: { key: 'center', roughness: 0.5 },
}

const FALLBACK = {
  body: '#f2e7d5',
  accent: '#c2582d',
  petal: '#f0c3c6',
  leaf: '#8fa089',
  center: '#e0b34d',
}

/**
 * Uma peca de porcelana fria gerada por codigo.
 * `interactive` liga a hitbox ampliada — sem ela, pecas de 5 cm ficam
 * impossiveis de acertar com o dedo.
 */
export function CeramicPiece({
  piece,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  interactive = false,
  highlighted = false,
  castShadow = true,
  label,
  onSelect,
  onHoverChange,
}) {
  const group = useRef()
  const [hovered, setHovered] = useState(false)

  const built = useMemo(() => buildPiece(piece), [piece])
  useEffect(() => () => disposePiece(built), [built])

  const materials = useMemo(() => {
    const made = {}
    for (const [name, cfg] of Object.entries(GROUP_MATERIAL)) {
      made[name] = new THREE.MeshStandardMaterial({
        color: piece[cfg.key] ?? FALLBACK[cfg.key],
        roughness: cfg.roughness,
        metalness: 0,
        envMapIntensity: 0.55,
      })
    }
    return made
  }, [piece])
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])

  const height = useMemo(() => pieceHeight(built), [built])
  const radius = useMemo(() => Math.max(pieceRadius(built), 0.03), [built])

  // Destaque: a peca sobe e cresce um pouco. Interpolado no quadro para nao
  // depender de nenhuma biblioteca de animacao.
  const target = useRef({ lift: 0, grow: 1 })
  target.current.lift = highlighted ? 0.035 : hovered ? 0.012 : 0
  target.current.grow = highlighted ? 1.12 : hovered ? 1.05 : 1

  useFrame((_, delta) => {
    if (!group.current) return
    const k = 1 - Math.exp(-10 * delta)
    const g = group.current
    g.position.y = THREE.MathUtils.lerp(g.position.y, position[1] + target.current.lift, k)
    const s = THREE.MathUtils.lerp(g.scale.x / scale, target.current.grow, k) * scale
    g.scale.setScalar(s)
    if (highlighted) g.rotation.y += delta * 0.35
  })

  const setHover = (value) => {
    if (!interactive) return
    setHovered(value)
    onHoverChange?.(value ? label : null)
    document.body.style.cursor = value ? 'pointer' : ''
  }

  useEffect(() => () => void (document.body.style.cursor = ''), [])

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      {Object.entries(built).map(([groupName, geometry]) => (
        <mesh
          key={groupName}
          geometry={geometry}
          material={materials[groupName]}
          castShadow={castShadow}
          receiveShadow
        />
      ))}

      {interactive && (
        <mesh
          position={[0, height / 2, 0]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHover(true)
          }}
          onPointerOut={() => setHover(false)}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
          }}
          visible={false}
        >
          {/* 1.6x o tamanho real: area de toque confortavel no celular */}
          <boxGeometry args={[radius * 3.2, Math.max(height, 0.06) * 1.25, radius * 3.2]} />
        </mesh>
      )}

      {highlighted && (
        <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 1.18, radius * 1.3, 40]} />
          <meshBasicMaterial color="#e07a4f" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}
