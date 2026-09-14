import { useState } from 'react'
import { useIsMobile } from '../hooks/useMedia'
import { Html } from '@react-three/drei'
import { products } from '../data/products'
import { PIECE_SCALE, shelf, shelfSlotPosition } from '../data/scene'
import { priceLabel } from '../lib/format'
import { useStore } from '../store/useStore'
import { CeramicPiece } from './CeramicPiece'

// Pecas que nao ficam de pe: prato e ima sao expostos inclinados,
// apoiados como numa vitrine. `lift` e em unidades de peca (antes da escala).
const DISPLAY = {
  prato: { rotation: [-1.12, 0, 0], lift: 0.098 },
  ima: { rotation: [-1.24, 0, 0], lift: 0.026 },
}

// Pecas de cenario nas vagas que sobraram, para a prateleira nao ter buraco.
const FILLER = [
  { shelf: 0, x: 1, piece: { kind: 'pilhaPratos', body: '#eadfcc', accent: '#b8734a' } },
  { shelf: 0, x: 3, piece: { kind: 'potinho', body: '#e0d3bd', accent: '#8fa089' } },
  { shelf: 1, x: 4, piece: { kind: 'potePinceis', body: '#ded0b8', accent: '#b8734a', leaf: '#6b5540' }, scale: 0.6 },
  { shelf: 2, x: 4, piece: { kind: 'pilhaPratos', body: '#f2e9da', accent: '#8fa089' }, scale: 0.9 },
]

// Sem distanceFactor de proposito: escalar com a distancia deixava a etiqueta
// ilegivel de longe e gigante no close-up da peca. Tamanho de tela e constante.
function Etiqueta({ product, position, onOpen }) {
  return (
    <Html position={position} center zIndexRange={[18, 0]} style={{ pointerEvents: 'auto' }}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onOpen()
        }}
        className="whitespace-nowrap rounded-md border border-carvao/15 bg-creme/95 px-2 py-1 text-left leading-tight shadow-sm"
        style={{ fontSize: 12 }}
      >
        <span className="block max-w-[12rem] truncate font-medium text-carvao">{product.name}</span>
        <span className="block font-semibold text-brasa">{priceLabel(product)}</span>
      </button>
    </Html>
  )
}

function ProdutoNaPrateleira({ product, showTag }) {
  const focusedProduct = useStore((s) => s.focusedProduct)
  const openProduct = useStore((s) => s.openProduct)
  const [hovered, setHovered] = useState(false)

  const base = shelfSlotPosition(product.slot)
  const display = DISPLAY[product.piece.kind] ?? { rotation: [0, 0, 0], lift: 0 }
  const escala = PIECE_SCALE * (product.piece.scale ?? 1)
  const highlighted = focusedProduct === product.id

  return (
    <group>
      <CeramicPiece
        piece={product.piece}
        position={[base[0], base[1] + display.lift * escala, base[2] + 0.015]}
        rotation={display.rotation}
        scale={escala}
        interactive
        highlighted={highlighted}
        label={product.name}
        onSelect={() => openProduct(product.id)}
        onHoverChange={(label) => setHovered(Boolean(label))}
      />
      {(showTag || hovered) && (
        <Etiqueta
          product={product}
          position={[base[0], base[1] + 0.02, shelf.z + shelf.depth / 2 + 0.02]}
          onOpen={() => openProduct(product.id)}
        />
      )}
    </group>
  )
}

export function Shelf() {
  const view = useStore((s) => s.view)
  const focusedProduct = useStore((s) => s.focusedProduct)
  const isMobile = useIsMobile()
  // As etiquetas aparecem so quando o usuario esta olhando a prateleira de
  // frente. No celular nao cabem cinco por nivel, e quando uma peca esta em
  // destaque a faixa de baixo ja mostra nome e preco.
  const showTag = !isMobile && view === 'prateleira' && !focusedProduct

  return (
    <group>
      {shelf.levels.map((y, level) => (
        <group key={level}>
          {/* tabua */}
          <mesh castShadow receiveShadow position={[0, y, shelf.z]}>
            <boxGeometry args={[shelf.halfW * 2, shelf.thickness, shelf.depth]} />
            <meshStandardMaterial color="#9a6b48" roughness={0.66} />
          </mesh>
          {/* mao-francesa */}
          {[-0.68, 0.68].map((x, i) => (
            <mesh key={i} castShadow position={[x, y - 0.07, shelf.z - 0.07]}>
              <boxGeometry args={[0.032, 0.1, 0.11]} />
              <meshStandardMaterial color="#5f5248" roughness={0.5} metalness={0.25} />
            </mesh>
          ))}
        </group>
      ))}

      {FILLER.map((f, i) => (
        <CeramicPiece
          key={i}
          piece={f.piece}
          position={[shelf.slotsX[f.x], shelf.levels[f.shelf] + shelf.thickness / 2, shelf.z + 0.01]}
          scale={PIECE_SCALE * (f.scale ?? 1)}
        />
      ))}

      {products.map((product) => (
        <ProdutoNaPrateleira key={product.id} product={product} showTag={showTag} />
      ))}
    </group>
  )
}
