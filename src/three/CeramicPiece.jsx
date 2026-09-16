import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '../hooks/useMedia'
import { buildPiece, pieceHeight, pieceRadius } from './pieceGeometry'

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
  quality = 'alta',
  label,
  onSelect,
  onHoverChange,
}) {
  const group = useRef()
  const [hovered, setHovered] = useState(false)
  const reduzida = useReducedMotion()

  // Uma unica geometria por peca e nivel, inclusive no destaque. A versao
  // cheia que o destaque usava custava 75 ms sincronos — engasgo no exato
  // quadro em que a camera se aproxima — e deixava ~1,9 MB no cache por peca
  // destacada. E, comparada na tela, ela lia PIOR: veja o comentario dos
  // niveis em pieceGeometry.js.
  const built = useMemo(() => buildPiece(piece, { qualidade: quality }), [piece, quality])

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

    if (highlighted && !reduzida) {
      g.rotation.y += delta * 0.35
    } else if (Math.abs(g.rotation.y - rotation[1]) > 0.002) {
      // Ao sair do destaque a peca ficava TORTA para sempre: o prop `rotation`
      // nao muda entre renders, entao o R3F nao o reaplica, e ninguem zerava o
      // que o giro somou. Traz de volta pela volta mais curta — sem a
      // normalizacao, uma peca que girou tres voltas desenrolaria as tres.
      const volta = Math.PI * 2
      let dif = (g.rotation.y - rotation[1]) % volta
      if (dif > Math.PI) dif -= volta
      if (dif < -Math.PI) dif += volta
      g.rotation.y = THREE.MathUtils.lerp(rotation[1] + dif, rotation[1], k)
      if (Math.abs(g.rotation.y - rotation[1]) < 0.004) g.rotation.y = rotation[1]
    }
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
            // Arrastar para girar a cena comeca, muitas vezes, com o dedo em
            // cima de uma peca: sem este corte o painel abria sozinho.
            if (e.delta > 6) return
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
