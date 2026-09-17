import { useEffect, useMemo, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { productById } from '../data/products'
import {
  orbit,
  pieceWorldHeight,
  quadroFraming,
  quadros,
  retratos,
  shelf,
  shelfSlotPosition,
  views,
} from '../data/scene'
import { useIsMobile, useIsTouch, useReducedMotion } from '../hooks/useMedia'
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

// Tempo parado antes de a camera voltar a respirar sozinha.
const ESPERA_RESPIRO = 2600
// ACTION.NONE do camera-controls: qualquer outro valor e alguem arrastando.
const SEM_ACAO = 0

export function CameraRig() {
  const controls = useRef(null)
  const scene = useThree((s) => s.scene)
  const view = useStore((s) => s.view)
  const focusedProduct = useStore((s) => s.focusedProduct)
  const quadroFocado = useStore((s) => s.quadroFocado)
  const entered = useStore((s) => s.entered)
  const cameraSeq = useStore((s) => s.cameraSeq)
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()
  const reduced = useReducedMotion()
  const ultimoToque = useRef(0)
  const alvo = useMemo(() => new THREE.Vector3(), [])
  const esfera = useMemo(() => new THREE.Spherical(), [])

  // Caixa em que o alvo pode andar. `boundaryEnclosesCamera` fica no padrao
  // (falso) de proposito: o preso e o ALVO, nao a camera — ela precisa poder
  // recuar pela frente aberta, que e de onde o diorama se ve.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const { min, max } = orbit.targetBounds
    c.setBoundary(new THREE.Box3(new THREE.Vector3(...min), new THREE.Vector3(...max)))
    // Atrito zero. Com atrito, o alvo que encosta na caixa desliza por uma
    // conta que o arremessa metros para dentro no primeiro pixel de pan; com
    // zero, e so um clamp.
    c.boundaryFriction = 0
  }, [])

  // As paredes sao colisores: quando o giro levaria a camera para tras de uma
  // delas, a biblioteca aproxima a camera do alvo em vez de atravessar. As
  // malhas vem marcadas em Atelier.jsx (userData.colisorCamera).
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const paredes = []
    scene.traverse((o) => {
      if (o.isMesh && o.userData.colisorCamera) paredes.push(o)
    })
    c.colliderMeshes = paredes
    return () => {
      c.colliderMeshes = []
    }
  }, [scene])

  // Quando o usuario esta no comando, o respiro sai de cena.
  useEffect(() => {
    const c = controls.current
    if (!c) return
    const marca = () => {
      ultimoToque.current = performance.now()
    }
    // 'controlstart' so vem de gesto de quem esta olhando — a biblioteca nao o
    // dispara em movimento programatico. Dali em diante a camera esta onde a
    // pessoa deixou, e nao no enquadramento que o site escolheu.
    const assumiu = () => {
      marca()
      useStore.getState().setVistaLivre(true)
    }
    c.addEventListener('controlstart', assumiu)
    c.addEventListener('control', marca)
    c.addEventListener('controlend', marca)
    return () => {
      c.removeEventListener('controlstart', assumiu)
      c.removeEventListener('control', marca)
      c.removeEventListener('controlend', marca)
    }
  }, [])

  // Esc desfaz o close (foto ou peca), como numa foto ampliada — o mesmo que o X
  // da barra da peca e o botao de casa. O comentario abaixo ja contava com isso,
  // mas so havia o Esc dos paineis e da apresentacao: medido em 1440, Esc com
  // foto ou peca em close nao mudava nada. Com painel ou apresentacao na tela o
  // Esc e deles: fecha so o painel e a peca embaixo continua (medido). A fase de
  // CAPTURA le o estado antes de qualquer outro Esc agir, sem depender da ordem
  // de registro — um link direto abre o painel antes de a cena montar.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      const s = useStore.getState()
      if (s.panel || document.querySelector('[role="dialog"]')) return
      if (s.quadroFocado || s.focusedProduct) s.clearFocus()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => {
    const c = controls.current
    if (!c || !entered) return

    // Tres fontes para o enquadramento, na ordem de prioridade: o quadro que a
    // pessoa clicou, a peca em destaque, e o preset da vista. O quadro entra
    // por aqui de proposito — reusar este caminho e o que faz o botao de casa, o
    // Esc e o "voltar para a visao geral" ja funcionarem como saida, sem eu
    // inventar um jeito proprio de desfazer o zoom.
    const quadro = quadroFocado
      ? [...quadros, ...retratos].find((q) => q.id === quadroFocado)
      : null
    const product = focusedProduct ? productById(focusedProduct) : null
    const preset = views[view] ?? views.home
    const framing = quadro
      ? quadroFraming(quadro, isMobile)
      : product
        ? productFraming(product, isMobile)
        : (isMobile && preset.mobile) || preset

    ultimoToque.current = performance.now()
    c.setLookAt(...framing.position, ...framing.target, !reduced)
    // De volta a um enquadramento conhecido: o rotulo pode voltar a dizer onde
    // a camera esta.
    useStore.getState().setVistaLivre(false)
    // cameraSeq nas dependencias e o que faz "voltar para a visao geral"
    // funcionar quando a vista ja e 'home' e so a camera saiu do lugar.
  }, [view, focusedProduct, quadroFocado, entered, isMobile, reduced, cameraSeq])

  useFrame((state, delta) => {
    const c = controls.current
    if (!c) return

    // --- faixa do angulo vertical, refeita a cada quadro ---
    // cameraY = alvoY + distancia * cos(polar). Exigir cameraMinY <= cameraY
    // <= cameraMaxY da as duas pontas da faixa: deixa olhar bem para cima de
    // perto (para ver as plantas da viga) sem a camera furar o assoalho nem
    // passar do teto de longe. A conta usa os valores de DESTINO: no meio de
    // uma transicao, a faixa calculada no ponto de partida cortaria o preset.
    c.getTarget(alvo, true)
    const fim = c.getSpherical(esfera, true)
    const d = Math.max(fim.radius, 0.001)
    // Com o clamp, acos nunca recebe valor fora de [-1, 1] (sem ele, alvo
    // abaixo de cameraMinY dava NaN e a camera sumia).
    const cosPiso = THREE.MathUtils.clamp((orbit.cameraMinY - alvo.y) / d, -0.999, 0.999)
    const cosTeto = THREE.MathUtils.clamp((orbit.cameraMaxY - alvo.y) / d, -0.999, 0.999)
    const minPolar = Math.max(orbit.minPolarAngle, Math.acos(cosTeto))
    const maxPolar = Math.max(minPolar, Math.min(orbit.maxPolarAngle, Math.acos(cosPiso)))
    c.minPolarAngle = minPolar
    c.maxPolarAngle = maxPolar
    // A biblioteca so aplica a faixa quando alguem GIRA. Zoom e pan mudam
    // distancia e alvo sem girar, e a camera ficaria fora da faixa ate o
    // proximo giro. Devolve com transicao, para nao dar tranco.
    if (fim.phi > maxPolar + 0.001) c.rotatePolarTo(maxPolar, true)
    else if (fim.phi < minPolar - 0.001) c.rotatePolarTo(minPolar, true)

    // --- respiro ---
    // Depois de alguns segundos parada, a camera volta a se mexer de leve (cerca
    // de um grau para cada lado): e o que tira a sensacao de fotografia.
    // Aplicado como DERIVADA de um seno, nao como posicao absoluta, entao a
    // oscilacao acontece em volta de onde o usuario deixou a camera.
    if (!entered || reduced) return
    if (c.currentAction !== SEM_ACAO) return
    if (performance.now() - ultimoToque.current < ESPERA_RESPIRO) return
    const t = state.clock.elapsedTime
    // delta limitado: ao voltar de uma aba escondida o primeiro quadro traz
    // segundos de delta, e o respiro virava um salto.
    const dt = Math.min(delta, 0.05)
    c.rotate(Math.cos(t * 0.24) * 0.005 * dt, Math.sin(t * 0.19) * 0.0016 * dt, true)
  })

  return (
    <CameraControls
      ref={controls}
      makeDefault
      // Mais rapido que o padrao da biblioteca: a 0.6 s a camera chegava
      // "flutuando" no destino e a navegacao parecia lenta.
      smoothTime={0.42}
      draggingSmoothTime={0.09}
      minDistance={orbit.minDistance}
      maxDistance={orbit.maxDistance}
      minPolarAngle={orbit.minPolarAngle}
      maxPolarAngle={orbit.maxPolarAngle}
      minAzimuthAngle={orbit.minAzimuthAngle}
      maxAzimuthAngle={orbit.maxAzimuthAngle}
      // Arrastar com o botao direito (ou dois dedos) desloca o alvo dentro da
      // caixa de `orbit.targetBounds`. Antes era zero, e era o que mais fazia
      // a navegacao parecer presa num ponto.
      truckSpeed={1.8}
      dollySpeed={0.9}
      // No toque o giro e mais lento, e o VERTICAL bem mais que o horizontal.
      // Com um dedo girando os dois eixos na mesma velocidade, arrastar dava
      // sensacao de camera de jogo em primeira pessoa — o retorno da revisao
      // foi exatamente esse: "parece camera de jogo, esquisito, menos
      // rotacional". Freando o vertical, um dedo passa a ler como girar uma
      // mesa giratoria: a sala roda em volta e o horizonte fica quieto.
      // Pelo PONTEIRO, e nao pela largura: por largura, iPad em pe e celular
      // deitado (>= 768, toque) giravam na velocidade de mouse, e uma janela
      // estreita de desktop, com mouse, na de toque. Medido lendo a instancia.
      azimuthRotateSpeed={isTouch ? 0.55 : 0.9}
      polarRotateSpeed={isTouch ? 0.26 : 0.75}
    />
  )
}
