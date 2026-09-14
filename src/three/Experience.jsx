import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useIsMobile } from '../hooks/useMedia'
import { useStore } from '../store/useStore'
import { Atelier } from './Atelier'
import { CameraRig } from './CameraRig'
import { Hotspots } from './Hotspot'
import { Lighting } from './Lighting'
import { Pinboard } from './Pinboard'
import { Shelf } from './Shelf'
import { WorkTable } from './WorkTable'

// Avisa a UI que a cena ja desenhou o primeiro quadro de verdade.
function SceneReady() {
  const setAssetsReady = useStore((s) => s.setAssetsReady)
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 3) setAssetsReady(true)
  })
  return null
}

// O prop `camera` do Canvas so vale na criacao. Girar o aparelho ou
// redimensionar a janela precisa recalcular o campo de visao aqui.
function CameraFov() {
  const isMobile = useIsMobile()
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    camera.fov = isMobile ? 50 : 38
    camera.updateProjectionMatrix()
  }, [camera, isMobile])
  return null
}

// Se o aparelho nao aguenta a cena, melhor oferecer o modo simples do que
// deixar a pessoa numa pagina travada.
function PerfWatch() {
  const reportLowPerf = useStore((s) => s.reportLowPerf)
  const acc = useRef({ time: 0, frames: 0, strikes: 0, grace: 0 })

  useFrame((_, delta) => {
    const a = acc.current
    // Os primeiros segundos sempre engasgam (compilar shader, montar
    // geometria). Medir ali daria alarme falso em aparelho bom.
    if (a.grace < 5) {
      a.grace += delta
      return
    }
    a.time += delta
    a.frames += 1
    if (a.time < 2.5) return
    const fps = a.frames / a.time
    a.time = 0
    a.frames = 0
    if (fps < 20) {
      a.strikes += 1
      if (a.strikes >= 3) reportLowPerf()
    } else {
      a.strikes = 0
    }
  })
  return null
}

function Scene({ quality }) {
  const alta = quality === 'alta'
  return (
    <>
      <color attach="background" args={['#1c1512']} />
      <fogExp2 attach="fog" args={['#241b16', 0.042]} />

      <Lighting quality={quality} />
      <Atelier />
      <WorkTable />
      <Shelf />
      <Pinboard />
      <Hotspots />

      {/* poeira no facho de luz da janela */}
      <Sparkles
        count={alta ? 60 : 24}
        scale={[2.6, 1.8, 1.6]}
        position={[0.9, 1.35, -0.4]}
        size={alta ? 2.2 : 1.6}
        speed={0.22}
        opacity={0.45}
        color="#ffe6c0"
      />

      <CameraRig />
      <CameraFov />
      <SceneReady />
      <PerfWatch />
    </>
  )
}

export function Experience() {
  const isMobile = useIsMobile()
  const lowPerf = useStore((s) => s.perfWarned)
  const quality = isMobile || lowPerf ? 'baixa' : 'alta'

  return (
    <Canvas
      shadows={quality === 'alta' ? 'soft' : false}
      dpr={[1, quality === 'alta' ? 1.75 : 1.25]}
      gl={{ antialias: quality === 'alta', powerPreference: 'high-performance' }}
      // Em retrato o campo horizontal encolhe muito: um fov maior evita
      // ter de afastar a camera ate a cena virar uma maquete distante.
      camera={{ position: [0.4, 2.1, 4.6], fov: isMobile ? 50 : 38, near: 0.1, far: 40 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
    >
      <Scene quality={quality} />
    </Canvas>
  )
}
