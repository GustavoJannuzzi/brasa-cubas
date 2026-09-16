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
import { Plants } from './Plants'
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
      <Plants quality={quality} />
      <Hotspots />

      {/* Poeira no facho de luz. Fica no caminho que o sol de verdade faz —
          do vao da janela (1.34, 1.72, -1.7) ate a bancada (0.5, 0.78, 0) —
          e nao num ponto qualquer: fora do facho nao haveria luz para revelar. */}
      <Sparkles
        count={alta ? 70 : 24}
        scale={[1.4, 1.3, 1.9]}
        position={[0.92, 1.26, -0.85]}
        size={alta ? 2.2 : 1.6}
        speed={0.22}
        opacity={0.5}
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
      // 'percentage' (PCF) e o que o three 0.186 usa de qualquer jeito: o
      // PCFSoftShadowMap de 'soft' foi removido e so gerava aviso no console.
      // A borda macia vem de shadow-radius, no Lighting.
      shadows={quality === 'alta' ? 'percentage' : false}
      dpr={[1, quality === 'alta' ? 1.75 : 1.25]}
      gl={{ antialias: quality === 'alta', powerPreference: 'high-performance' }}
      // Em retrato o campo horizontal encolhe muito: um fov maior evita
      // ter de afastar a camera ate a cena virar uma maquete distante.
      camera={{ position: [0.22, 1.66, 2.5], fov: isMobile ? 50 : 38, near: 0.08, far: 30 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08

        // O navegador in-app (WKWebView) derruba o contexto ao voltar de outro
        // app — e a saida principal deste site e justamente ir ao WhatsApp e
        // voltar. Sem isto, a cena fica preta atras do menu, sem aviso nenhum.
        const tela = gl.domElement
        tela.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          useStore.getState().setGl3d('perdido')
        })
        tela.addEventListener('webglcontextrestored', () => {
          useStore.getState().setGl3d('ok')
        })
      }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
    >
      <Scene quality={quality} />
    </Canvas>
  )
}
