import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useIsMobile } from '../hooks/useMedia'
import { foiRebaixado, limparRebaixamento, marcarRebaixado, tierDoAparelho } from '../lib/tier'
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

// Quantos quadros a sombra continua sendo refeita de graca depois de montar.
// Cobre o assentamento da cena: geometria que chega, material que compila, a
// peca que ainda esta interpolando a posicao inicial. Contado em quadros, nao
// em segundos, que e o que importa para material compilar — mas baixo de
// proposito: neste desktop a cena roda a 18,5 fps, e 90 quadros eram quase
// cinco segundos pagando a passada de sombra a toa.
const QUADROS_DE_ASSENTAMENTO = 45

/**
 * Para de refazer o mapa de sombra numa cena que nao mudou.
 *
 * Medido: com o mapa vivo sao 287 chamadas e 243.218 triangulos por quadro;
 * congelado, 108 e 68.184. Ou seja, 72% dos triangulos do quadro eram 179
 * projetores redesenhados para produzir exatamente a mesma imagem. Parado, nem
 * uma matriz de projetor muda: a peca converge o lerp ate a igualdade de float,
 * e o vento da planta e uniforme de shader que nem chega ao material de
 * profundidade — a sombra da folha ja e estatica hoje.
 *
 * Quem mexe pede: ver o `needsUpdate` no useFrame de CeramicPiece.
 */
function Sombra() {
  const gl = useThree((s) => s.gl)
  const quadros = useRef(0)

  useFrame(() => {
    if (quadros.current > QUADROS_DE_ASSENTAMENTO) return
    quadros.current += 1
    if (quadros.current <= QUADROS_DE_ASSENTAMENTO) return
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
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

// O navegador in-app (WKWebView) derruba o contexto ao voltar de outro app — e
// a saida principal deste site e justamente ir ao WhatsApp e voltar. Sem isto,
// a cena fica preta atras do menu, sem aviso nenhum.
function GuardaContexto() {
  const gl = useThree((s) => s.gl)

  useEffect(() => {
    const tela = gl.domElement
    const perdeu = (e) => {
      e.preventDefault()
      useStore.getState().setGl3d('perdido')
    }
    const voltou = () => useStore.getState().setGl3d('ok')

    tela.addEventListener('webglcontextlost', perdeu)
    tela.addEventListener('webglcontextrestored', voltou)
    return () => {
      // Sair para o modo lista desmonta o Canvas, e o R3F derruba o contexto ao
      // descartar o renderer. Sem tirar o ouvinte antes, essa perda planejada
      // acendia a faixa de "o 3D parou de desenhar" numa pagina sem 3D nenhum.
      tela.removeEventListener('webglcontextlost', perdeu)
      tela.removeEventListener('webglcontextrestored', voltou)
    }
  }, [gl])

  return null
}

// Carencia antes de medir: compilar shader e montar geometria sempre engasga.
const CARENCIA = 5
// 50 ms de quadro sao 20 fps. A conta e pela MEDIANA da janela, nao pela
// media: um engasgo isolado nao condena o aparelho.
const QUADRO_RUIM = 50

/**
 * Se o aparelho nao aguenta a cena, melhor oferecer o modo simples do que
 * deixar a pessoa numa pagina travada. Mas o recuo e em degraus, e o primeiro
 * nao recompila nada: so desenha menos pixel.
 *
 * A media anterior condenava quem tinha ido ao WhatsApp e voltado — que e a
 * saida principal deste site. Parado em outro app, o rAF nao roda; o primeiro
 * quadro na volta traz todo o tempo de fora e a janela inteira dava ~0 fps.
 */
function PerfWatch({ aoBaixarDpr }) {
  const reportLowPerf = useStore((s) => s.reportLowPerf)
  const acc = useRef({ tempos: [], janela: 0, ruins: 0, boas: 0, avaliadas: 0, carencia: 0, degrau: 0, subiu: false })

  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState !== 'visible') return
      // Na volta ainda ha textura e geometria para reenviar a GPU: medir agora
      // mede o reenvio, nao o aparelho.
      const a = acc.current
      a.tempos = []
      a.janela = 0
      a.ruins = 0
      a.avaliadas = 0
      a.carencia = CARENCIA - 2
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [])

  useFrame((_, delta) => {
    const a = acc.current
    if (a.carencia < CARENCIA) {
      a.carencia += delta
      return
    }
    // Quadro absurdo e aba que voltou, alt-tab ou depurador aberto — nao e
    // desempenho. Descarta e recomeca a janela.
    if (delta > 0.25) {
      a.tempos = []
      a.janela = 0
      return
    }

    a.tempos.push(delta * 1000)
    a.janela += delta
    if (a.janela < 2) return

    const ordenados = [...a.tempos].sort((x, y) => x - y)
    const mediana = ordenados[Math.floor(ordenados.length / 2)]
    a.tempos = []
    a.janela = 0
    a.avaliadas += 1

    if (mediana > QUADRO_RUIM) {
      a.ruins += 1
      a.boas = 0
    } else {
      a.boas += 1
      // Vinte segundos seguidos de quadro bom desfazem um rebaixamento antigo.
      // O nivel NAO muda agora: trocar de nivel no meio do uso recompilaria
      // todos os programas, que e justamente o tombo que se quer evitar. A
      // proxima visita e que abre completa.
      if (!a.subiu && a.boas >= 10 && foiRebaixado()) {
        a.subiu = true
        limparRebaixamento()
      }
    }

    if (a.avaliadas < 4) return

    const ruim = a.ruins >= 3
    a.avaliadas = 0
    a.ruins = 0
    if (!ruim) return

    // Degrau 1: menos pixel. Nao mexe em material nem em geometria, entao nao
    // ha recompilacao — e costuma ser o que falta num aparelho no limite.
    if (a.degrau === 0) {
      a.degrau = 1
      // Sobe para o React em vez de chamar setDpr aqui: o prop `dpr` do Canvas
      // e declarativo e o R3F o reaplica a cada re-renderizacao, entao o
      // setDpr imperativo durava ate o proximo render — o degrau 1 se desfazia
      // sozinho no primeiro toque em qualquer botao.
      aoBaixarDpr?.()
      a.carencia = 0
      return
    }
    // Degrau 2: cai de nivel e avisa. Fica guardado para a proxima visita
    // comecar no degrau certo, em vez de repetir o engasgo da queda.
    marcarRebaixado()
    reportLowPerf()
  })
  return null
}

function Scene({ quality, aoBaixarDpr }) {
  const alta = quality === 'alta'
  return (
    <>
      <color attach="background" args={['#1c1512']} />
      <fogExp2 attach="fog" args={['#241b16', 0.042]} />

      <Lighting quality={quality} />
      <Atelier />
      <WorkTable quality={quality} />
      <Shelf quality={quality} />
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
      <Sombra />
      <PerfWatch aoBaixarDpr={aoBaixarDpr} />
      <GuardaContexto />
    </>
  )
}

export function Experience() {
  const isMobile = useIsMobile()
  const lowPerf = useStore((s) => s.perfWarned)
  // Pelo APARELHO, nao pela largura da janela, e uma vez so: girar o celular
  // nao pode trocar sombra nem antialias no meio do gesto.
  const aparelho = useMemo(() => (foiRebaixado() ? 'baixa' : tierDoAparelho()), [])
  const quality = lowPerf || aparelho === 'baixa' ? 'baixa' : 'alta'
  // Teto de dpr do degrau 1 do PerfWatch. Precisa viver no React porque o prop
  // `dpr` e reaplicado a cada render.
  const [tetoDpr, setTetoDpr] = useState(null)

  return (
    <Canvas
      // 'percentage' (PCF) e o que o three 0.186 usa de qualquer jeito: o
      // PCFSoftShadowMap de 'soft' foi removido e so gerava aviso no console.
      // A borda macia vem de shadow-radius, no Lighting.
      shadows={quality === 'alta' ? 'percentage' : false}
      dpr={[1, tetoDpr ?? (quality === 'alta' ? 1.75 : 1.25)]}
      // Coerente porque o nivel do aparelho nao muda depois de criado o
      // renderer. Em aparelho de toque, 'default' deixa o sistema escolher a
      // GPU integrada, que gasta menos bateria e aquece menos.
      gl={{
        antialias: aparelho === 'alta',
        powerPreference: aparelho === 'alta' ? 'high-performance' : 'default',
      }}
      // Em retrato o campo horizontal encolhe muito: um fov maior evita
      // ter de afastar a camera ate a cena virar uma maquete distante.
      camera={{ position: [0.22, 1.66, 2.5], fov: isMobile ? 50 : 38, near: 0.08, far: 30 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
    >
      <Scene quality={quality} aoBaixarDpr={() => setTetoDpr(1)} />
    </Canvas>
  )
}
