import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { navegacaoDoProto } from '../proto/nav'
import { useIsMobile, useIsTouch, useReducedMotion } from '../hooks/useMedia'
import { useStore } from '../store/useStore'

// Cola entre o CameraRig e a variante de navegacao em teste (?nav=).
//
// A divisao de trabalho e proposital: a VARIANTE e matematica pura, sem
// importar three nem drei (senao o empacotador moveria o three para um pedaco
// compartilhado e o caminho PADRAO passaria a baixar o 3D em duas requisicoes);
// a COLA, que e este arquivo, e quem sabe de evento de ponteiro, de camera, de
// quadro e de cena. Sem parametro na URL nada disto roda: `navegacaoDoProto()`
// devolve null e o rig segue exatamente como hoje.
//
// Sao dois feitios de variante:
//
// - GESTOS PROPRIOS (trilho, estacoes): a variante escreve a pose inteira e o
//   giro da biblioteca sai de cena. A cola le o dedo e devolve numeros.
// - GESTOS DA BIBLIOTECA (orbita): quem gira continua sendo o camera-controls,
//   porque orbitar e o que ele faz bem. A variante so muda o pivô, o limite do
//   giro e quais paredes ficam na frente.
//
// Quatro cuidados que sairam de revisao do proprio codigo, e cada um seria um
// defeito no aparelho do dono:
//
// 1. PRIORIDADE -2 no useFrame. O drei chama controls.update(delta) em -1, e o
//    camera-controls so escreve camera.position dentro do update(). Escrevendo
//    a pose depois disso, o dedo andaria um quadro inteiro na frente da cena.
// 2. SAIR CEDO quando nao ha dedo, nem inercia, nem mistura pendente, nem
//    respiro autorizado. Sem isso o setLookAt roda todo quadro para sempre
//    depois do primeiro arrasto — e o loop em 'demand' nunca mais dorme, com a
//    cena desenhando atras da folha aberta no celular. E o defeito que o commit
//    fbd8b10 consertou, voltando por caminho novo.
// 3. CAPTURA DO PONTEIRO. Os overlays (chip, barra de baixo, cartao) sao irmaos
//    do canvas: sem captura, o arrasto que cruza a barra de 46,5 px congela no
//    meio, porque o pointermove passa a ir para o overlay.
// 4. LEVANTAR UM DEDO da pinca nao encerra o gesto, e pointercancel (barra do
//    iPhone, ligacao) nao vira peteleco: solta sem inercia.

const TOLERANCIA = 6
const ESPERA_RESPIRO = 2600

const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

export function useNavegacaoProto(controls) {
  const gl = useThree((s) => s.gl)
  const cena = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()
  const reduzido = useReducedMotion()
  const entrou = useStore((s) => s.entered)
  const painelAberto = useStore((s) => Boolean(s.panel))

  const variante = useMemo(() => {
    const criar = navegacaoDoProto()
    return criar ? criar({ celular: isMobile, toque: isTouch, reduzido }) : null
  }, [isMobile, isTouch, reduzido])

  const est = useRef({
    estado: null,
    congelada: null,
    comandando: false,
    ponteiros: new Map(),
    pinca: 0,
    ultimo: null,
    vel: 0,
    ultimoToque: 0,
    mistura: 0,
    lugar: null,
    reancorado: false,
    corte: { esq: 0, dir: 0 },
  })

  // --- ajustes que a variante pede na propria biblioteca ---
  useEffect(() => {
    const c = controls.current
    if (!c || !variante) return
    const NADA = c.constructor.ACTION.NONE
    const mouse = { ...c.mouseButtons }
    const toques = { ...c.touches }
    const antes = {
      maxDistance: c.maxDistance,
      minAzimuthAngle: c.minAzimuthAngle,
      maxAzimuthAngle: c.maxAzimuthAngle,
      azimuthRotateSpeed: c.azimuthRotateSpeed,
      polarRotateSpeed: c.polarRotateSpeed,
    }

    if (variante.gestosProprios) {
      // Quem le o dedo e esta cola. Sem isso, os dois comandariam a camera no
      // mesmo quadro. Atencao: o <CameraControls> CONTINUA montado de proposito
      // — e o preventDefault do ouvinte dele que impede a pagina de rolar e de
      // ampliar no iPhone enquanto a cola comanda.
      c.mouseButtons.left = NADA
      c.mouseButtons.right = NADA
      c.mouseButtons.middle = NADA
      c.mouseButtons.wheel = NADA
      c.touches.one = NADA
      c.touches.two = NADA
      c.touches.three = NADA
    } else if (variante.controles) {
      const v = variante.controles
      if (v.maxDistance) c.maxDistance = v.maxDistance
      if (v.minAzimuthAngle !== undefined) c.minAzimuthAngle = v.minAzimuthAngle
      if (v.maxAzimuthAngle !== undefined) c.maxAzimuthAngle = v.maxAzimuthAngle
      if (v.azimuthRotateSpeed) c.azimuthRotateSpeed = v.azimuthRotateSpeed
      if (v.polarRotateSpeed) c.polarRotateSpeed = v.polarRotateSpeed
      // O pan de dois dedos e o que arrancaria o pivô do centro do comodo.
      if (v.semTruckDeDoisDedos) c.touches.two = c.constructor.ACTION.TOUCH_DOLLY
    }

    return () => {
      Object.assign(c.mouseButtons, mouse)
      Object.assign(c.touches, toques)
      Object.assign(c, antes)
    }
  }, [controls, variante])

  // --- gestos proprios: ponteiro no canvas ---
  useEffect(() => {
    const c = controls.current
    const el = gl.domElement
    if (!c || !variante?.gestosProprios || !el) return

    const s = est.current

    const pose = () => {
      const p = c.camera.position
      const alvo = { x: 0, y: 0, z: 0 }
      c.getTarget(alvo)
      return { pos: [p.x, p.y, p.z], alvo: [alvo.x, alvo.y, alvo.z] }
    }

    // Meio quadro da lente EM USO. Ler da camera, e nao recalcular da largura da
    // janela, e o que faz gaveta aberta, celular deitado e pinca entrarem de
    // graca na conta de "ate onde da para virar sem ver o vazio".
    const meioQuadro = () => {
      const meiaV = ((c.camera.fov / 2) * Math.PI) / 180
      return { meiaV, meiaH: Math.atan(Math.tan(meiaV) * c.camera.aspect) }
    }

    const assumir = () => {
      if (s.comandando) return
      s.congelada = pose()
      s.estado = variante.inicial(s.congelada)
      s.comandando = true
      s.mistura = 0
      useStore.getState().setVistaLivre(true)
    }

    const aoDescer = (e) => {
      s.ponteiros.set(e.pointerId, { x: e.clientX, y: e.clientY, inicio: { x: e.clientX, y: e.clientY } })
      if (s.ponteiros.size === 2) {
        const [a, b] = [...s.ponteiros.values()]
        s.pinca = distancia(a, b)
      }
      s.ultimo = null
      s.vel = 0
      s.ultimoToque = performance.now()
      // Sem captura, o arrasto morre assim que o dedo cruza um overlay.
      try {
        el.setPointerCapture(e.pointerId)
      } catch (err) {
        // navegador que recuse a captura nao pode derrubar o gesto
      }
    }

    const aoMover = (e) => {
      const p = s.ponteiros.get(e.pointerId)
      if (!p) return
      const anterior = { x: p.x, y: p.y }
      p.x = e.clientX
      p.y = e.clientY
      s.ultimoToque = performance.now()

      const menor = Math.min(el.clientWidth, el.clientHeight)
      const lente = meioQuadro()

      if (s.ponteiros.size >= 2) {
        const [a, b] = [...s.ponteiros.values()]
        const agora = distancia(a, b)
        if (s.pinca > 0 && agora > 0) {
          assumir()
          s.estado = variante.pincar(s.estado, agora / s.pinca)
        }
        s.pinca = agora
        // O ponto medio tambem comanda: quem pinca com deriva nao pode ficar
        // com a cena travada.
        if (s.comandando) {
          s.estado = variante.arrastar(s.estado, {
            dx: (e.clientX - anterior.x) / 2,
            dy: (e.clientY - anterior.y) / 2,
            menor,
            ...lente,
          })
          s.mistura = Math.min(1, s.mistura + Math.abs(e.clientX - anterior.x) / menor)
        }
        invalidate()
        return
      }

      if (!s.comandando && distancia(p, p.inicio) < TOLERANCIA) return
      assumir()

      const dx = e.clientX - anterior.x
      const dy = e.clientY - anterior.y
      const agora = performance.now()
      if (s.ultimo) {
        const dt = Math.max(0.008, (agora - s.ultimo.t) / 1000)
        s.vel = -(dx / menor) / dt
      }
      s.ultimo = { t: agora }
      s.estado = variante.arrastar(s.estado, { dx, dy, menor, ...lente })
      // A mistura anda com o DEDO, nunca com o relogio: alimentada por tempo,
      // encostar 6 px no vidro e soltar deslizava a camera 1,56 m sozinha.
      s.mistura = Math.min(1, s.mistura + (Math.abs(dx) + Math.abs(dy)) / (menor * 0.45))
      invalidate()
    }

    const aoSubir = (e) => {
      const tinha = s.ponteiros.size
      s.ponteiros.delete(e.pointerId)
      if (s.ponteiros.size < 2) s.pinca = 0
      try {
        el.releasePointerCapture(e.pointerId)
      } catch (err) {
        // ja solto
      }
      // Levantar UM dedo da pinca nao encerra o gesto.
      if (s.ponteiros.size > 0 || tinha === 0) return
      s.ultimoToque = performance.now()
      if (!s.comandando || !variante.soltar) return
      // Gesto cancelado pelo sistema (barra do iPhone, ligacao) nao vira
      // peteleco: seria inercia que ninguem pediu.
      const cancelado = e.type === 'pointercancel'
      s.estado = variante.soltar(s.estado, cancelado ? 0 : s.vel * 0.9)
      invalidate()
    }

    el.addEventListener('pointerdown', aoDescer)
    el.addEventListener('pointermove', aoMover)
    el.addEventListener('pointerup', aoSubir)
    el.addEventListener('pointercancel', aoSubir)
    return () => {
      el.removeEventListener('pointerdown', aoDescer)
      el.removeEventListener('pointermove', aoMover)
      el.removeEventListener('pointerup', aoSubir)
      el.removeEventListener('pointercancel', aoSubir)
    }
  }, [controls, variante, gl, invalidate])

  // --- gestos da biblioteca: re-ancorar o pivô no primeiro arrasto ---
  useEffect(() => {
    const c = controls.current
    if (!c || !variante || variante.gestosProprios || !variante.reancorar) return
    const aoComecar = () => {
      const s = est.current
      if (s.reancorado) return
      s.reancorado = true
      const p = c.camera.position
      const alvo = { x: 0, y: 0, z: 0 }
      c.getTarget(alvo)
      const novo = variante.reancorar({ pos: [p.x, p.y, p.z], alvo: [alvo.x, alvo.y, alvo.z] })
      if (!novo) return
      // Mesma posicao, mesma direcao: a imagem nao muda, so o pivô.
      c.setLookAt(p.x, p.y, p.z, novo[0], novo[1], novo[2], false)
      invalidate()
    }
    c.addEventListener('controlstart', aoComecar)
    return () => c.removeEventListener('controlstart', aoComecar)
  }, [controls, variante, invalidate])

  // --- as paredes que podem sumir, achadas uma vez ---
  const paredes = useMemo(() => {
    if (!variante?.corte) return null
    const grupos = { esq: [], dir: [] }
    cena.traverse((o) => {
      const lado = o.userData?.parede
      if (lado === 'esq' || lado === 'dir') grupos[lado].push(o)
    })
    return grupos
  }, [cena, variante])

  useFrame((state, delta) => {
    const c = controls.current
    const s = est.current
    if (!c || !variante) return
    const dt = Math.min(delta, 0.05)

    if (variante.gestosProprios) {
      if (!s.comandando || !s.estado || !variante.quadro) return
      // O respiro segue as mesmas duas guardas do CameraRig: com a folha aberta
      // no celular ninguem ve a cena, e antes de entrar nao ha cena para ver.
      const respirar =
        !reduzido &&
        entrou &&
        !(isMobile && painelAberto) &&
        s.ponteiros.size === 0 &&
        performance.now() - s.ultimoToque > ESPERA_RESPIRO
      const parado =
        !respirar && s.ponteiros.size === 0 && s.mistura >= 1 && Math.abs(s.estado.vel || 0) < 0.0001
      if (parado) return

      const r = variante.quadro(s.estado, dt, state.clock.elapsedTime, respirar)
      s.estado = r.estado
      const m = s.mistura
      const p = r.pose
      const f = s.congelada
      const misturar = (a, b) => a + (b - a) * m
      c.setLookAt(
        misturar(f.pos[0], p.pos[0]),
        misturar(f.pos[1], p.pos[1]),
        misturar(f.pos[2], p.pos[2]),
        misturar(f.alvo[0], p.alvo[0]),
        misturar(f.alvo[1], p.alvo[1]),
        misturar(f.alvo[2], p.alvo[2]),
        false,
      )
      // O rotulo do chip: nas pontas de qualquer variante nenhum marcador fica
      // em quadro, e o lugar escrito passa a ser a unica orientacao.
      if (variante.lugar) {
        const lugar = variante.lugar(s.estado)
        if (lugar !== s.lugar) {
          s.lugar = lugar
          useStore.getState().setLugarProto(lugar)
        }
      }
      if (r.vivo || respirar) invalidate()
      return
    }

    // Órbita: limite do giro refeito por quadro, do mesmo jeito que o rig ja faz
    // com o angulo vertical — zoom e pan mudam a conta sem girar.
    if (variante.azimuteMaximo) {
      const alvo = { x: 0, y: 0, z: 0 }
      c.getTarget(alvo, true)
      const limite = variante.azimuteMaximo({
        alvo: [alvo.x, alvo.y, alvo.z],
        dist: c.distance,
        phi: c.polarAngle,
      })
      c.minAzimuthAngle = -limite
      c.maxAzimuthAngle = limite
      if (c.azimuthAngle > limite + 0.001) c.rotateAzimuthTo(limite, true)
      else if (c.azimuthAngle < -limite - 0.001) c.rotateAzimuthTo(-limite, true)
    }

    // Corte: a parede atras da qual a camera esta some, em 0,3 s.
    if (variante.corte && paredes) {
      const p = c.camera.position
      const querCortar = variante.corte([p.x, p.y, p.z])
      const passo = dt / (variante.tempoDeCorte || 0.3)
      let mudou = false
      for (const lado of ['esq', 'dir']) {
        const alvoCorte = querCortar[lado] ? 1 : 0
        const atual = s.corte[lado]
        if (atual === alvoCorte) continue
        const novo = alvoCorte > atual ? Math.min(alvoCorte, atual + passo) : Math.max(alvoCorte, atual - passo)
        s.corte[lado] = novo
        mudou = true
        for (const o of paredes[lado]) o.visible = novo < 0.5
      }
      if (mudou) invalidate()
    }
  }, -2)

  // Estavel de proposito: o rig usa isto na lista de dependencias do efeito de
  // enquadramento, e uma funcao nova a cada render faria o efeito rodar sem
  // parar, reescrevendo a camera em todo quadro.
  const aoEnquadrar = useCallback(() => {
    est.current.comandando = false
    est.current.estado = null
    est.current.mistura = 0
    est.current.lugar = null
    useStore.getState().setLugarProto(null)
  }, [])

  return useMemo(() => ({ variante, aoEnquadrar }), [variante, aoEnquadrar])
}
