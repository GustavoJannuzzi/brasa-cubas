import { useState } from 'react'
import { Html } from '@react-three/drei'
import { products } from '../data/products'
import { PIECE_SCALE, shelf, shelfSlotPosition } from '../data/scene'
import { useCliqueSemArrasto } from '../hooks/useCliqueSemArrasto'
import { useIsMobile } from '../hooks/useMedia'
import { priceLabel } from '../lib/format'
import { useStore } from '../store/useStore'
import { CeramicPiece } from './CeramicPiece'
import { roundedBox } from './shapes'

// Pecas que nao ficam de pe: prato e ima sao expostos inclinados,
// apoiados como numa vitrine. `lift` e em unidades de peca (antes da escala).
const DISPLAY = {
  prato: { rotation: [-1.12, 0, 0], lift: 0.098 },
  ima: { rotation: [-1.24, 0, 0], lift: 0.026 },
}

// Pecas de cenario nas vagas que sobraram, para a prateleira nao ter buraco.
// As duas vagas da direita que antes tinham pote de pincel e pilha de prato
// agora sao planta (ver `plants` em data/scene.js): verde na estante mudou
// mais a cena do que uma terceira pilha de louca bege.
const FILLER = [
  { shelf: 0, x: 1, piece: { kind: 'pilhaPratos', body: '#eadfcc', accent: '#b8734a' } },
  { shelf: 0, x: 3, piece: { kind: 'potinho', body: '#e0d3bd', accent: '#8fa089' } },
]

// Sem distanceFactor de proposito: escalar com a distancia deixava a etiqueta
// ilegivel de longe e gigante no close-up da peca. Tamanho de tela e constante.
//
// Pendurada ABAIXO da quina da tabua, como etiqueta de gondola. Centralizada na
// quina (como era antes, com `center`), a metade de cima subia por cima do
// produto: nas pecas baixas — porta-joias, ima, lembrancinha — o proprio preco
// escondia a peca que ele anuncia.
function Etiqueta({ product, position, onOpen }) {
  const semArrasto = useCliqueSemArrasto((e) => {
    e.stopPropagation()
    onOpen()
  })

  return (
    <Html position={position} zIndexRange={[18, 0]} style={{ pointerEvents: 'auto' }} aria-hidden="true">
      {/* Sem `center`: o ponto projetado e o canto da etiqueta. O translate
          horizontal centraliza na vaga e deixa a etiqueta CRESCER para baixo,
          longe da peca. */}
      <div style={{ transform: 'translate(-50%, 0)' }}>
        {/* Fora do caminho do teclado, como os marcadores: a etiqueta e DOM
            solto sobre a cena e continua focavel mesmo fora do quadro. O
            catalogo lista as mesmas pecas, com nome e preco. */}
        {/* Largura travada no BOTAO, nao no nome: o passo entre vagas encolhe
            com a altura da janela, e a 720 px de altura ele fica em 143 px.
            Com 132 px de etiqueta sobra vao entre vizinhas ate la. */}
        <button type="button" tabIndex={-1} {...semArrasto} className="etiqueta-peca w-[8.25rem]">
          {/* Duas linhas no maximo: sem o corte, nome comprido em coluna
              estreita empilha quatro linhas e a etiqueta vira um bloco. */}
          <span className="line-clamp-2 text-xs leading-tight font-medium whitespace-normal text-carvao">
            {product.name}
          </span>
          <span className="block text-sm font-semibold text-brasa-texto">{priceLabel(product)}</span>
        </button>
      </div>
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
          // base[1] e o TOPO da tabua. Desce a espessura inteira mais 12 mm
          // para pendurar sob a quina, e fica quase rente a face da frente.
          position={[base[0], base[1] - shelf.thickness - 0.012, shelf.z + shelf.depth / 2 + 0.005]}
          onOpen={() => openProduct(product.id)}
        />
      )}
    </group>
  )
}

/** Mao-francesa: chapa na parede, chapa sob a tabua e um tirante na diagonal. */
function MaoFrancesa({ x, y }) {
  const zParede = shelf.z - shelf.depth / 2
  return (
    <group position={[x, y, 0]}>
      <mesh geometry={roundedBox(0.03, 0.17, 0.014, 0.005)} position={[0, -0.095, zParede + 0.008]} castShadow>
        <meshStandardMaterial color="#544940" roughness={0.42} metalness={0.35} />
      </mesh>
      <mesh geometry={roundedBox(0.03, 0.014, 0.19, 0.005)} position={[0, -0.03, zParede + 0.096]} castShadow>
        <meshStandardMaterial color="#544940" roughness={0.42} metalness={0.35} />
      </mesh>
      <mesh
        geometry={roundedBox(0.022, 0.012, 0.2, 0.005)}
        position={[0, -0.095, zParede + 0.082]}
        rotation={[0.72, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#544940" roughness={0.42} metalness={0.35} />
      </mesh>
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
          {/* tabua: canto arredondado de 8 mm, que e o que uma tabua lixada
              tem e o que pega o brilho do sol na quina da frente */}
          <mesh
            geometry={roundedBox(shelf.halfW * 2, shelf.thickness, shelf.depth, 0.008)}
            position={[0, y, shelf.z]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial color="#9a6b48" roughness={0.6} />
          </mesh>
          {[-0.68, 0.68].map((x) => (
            <MaoFrancesa key={x} x={x} y={y} />
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
