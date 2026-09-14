import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { productById } from '../data/products'
import { pieceWorldHeight, shelf, shelfSlotPosition, views } from '../data/scene'
import { useIsMobile, useReducedMotion } from '../hooks/useMedia'
import { useStore } from '../store/useStore'

// Distancia proporcional ao tamanho da peca: a peca ocupa mais ou menos o
// mesmo pedaco do quadro, e sempre sobra prateleira em volta para o usuario
// entender onde ela esta.
const productFraming = (product, mobile) => {
  const [x, y] = shelfSlotPosition(product.slot)
  const h = pieceWorldHeight(product.piece)
  const distance = Math.min(1.6, Math.max(0.5, h * (mobile ? 3.4 : 4.5)))
  return {
    position: [x, y + h * 0.75, shelf.z + distance],
    target: [x, y + h * 0.42, shelf.z + 0.02],
  }
}

export function CameraRig() {
  const controls = useRef(null)
  const view = useStore((s) => s.view)
  const focusedProduct = useStore((s) => s.focusedProduct)
  const entered = useStore((s) => s.entered)
  const isMobile = useIsMobile()
  const reduced = useReducedMotion()

  useEffect(() => {
    const c = controls.current
    if (!c || !entered) return

    const product = focusedProduct ? productById(focusedProduct) : null
    const preset = views[view] ?? views.home
    const framing = product
      ? productFraming(product, isMobile)
      : (isMobile && preset.mobile) || preset

    c.setLookAt(...framing.position, ...framing.target, !reduced)
  }, [view, focusedProduct, entered, isMobile, reduced])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      smoothTime={0.6}
      draggingSmoothTime={0.14}
      minDistance={0.35}
      maxDistance={5}
      minPolarAngle={0.32}
      maxPolarAngle={Math.PI / 2 + 0.04}
      minAzimuthAngle={-0.9}
      maxAzimuthAngle={0.95}
      // Arrastar move a orbita, nunca o alvo: assim nao da para "se perder"
      // fora do ateliê e sempre existe um caminho de volta.
      truckSpeed={0}
      dollySpeed={0.6}
    />
  )
}
