import { Suspense, memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { useIsMobile, useReducedMotion } from '../hooks/useMedia'
import { foiRebaixado, limparRebaixamento, marcarRebaixado, tierDoAparelho } from '../lib/tier'
import { useStore } from '../store/useStore'
import { Atelier } from './Atelier'
import { CameraRig } from './CameraRig'
import { FotoOpcional } from './FotoOpcional'
import { fovVertical, larguraDaGaveta } from './lente'
import { Gato } from './Cat'
import { Hotspots } from './Hotspot'
import { Lighting } from './Lighting'
import { Pinboard } from './Pinboard'
import { Plants } from './Plants'
import { Quadros } from './Quadros'
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
// redimensionar a janela precisa recalcular o campo de visao aqui. A conta da
// abertura esta em lente.js, dividida com as etiquetas da prateleira.

// Mesma duracao da entrada da gaveta (.anim-gaveta, 0.32 s).
const GAVETA_SEGUNDOS = 0.32

function CameraFov() {
  const isMobile = useIsMobile()
  const reduzida = useReducedMotion()
  const camera = useThree((s) => s.camera)
  const tamanho = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  // Com a gaveta aberta, a "tela" da camera e so a area livre a esquerda dela.
  // Antes a camera centralizava na tela INTEIRA e a gaveta cobria o centro: em
  // 768x1024 o close da peca clicada ficava 59% atras dela (so meia noiva do topo
  // de bolo a vista), 41% em 1024x768; o caderno do Orcamento, pela metade.
  // setViewOffset com a largura cheia = area livre desloca e, se a area livre for
  // estreita, abre o campo — o alvo da camera cai no meio do que se ve.
  const gavetaAberta = useStore((s) => !isMobile && Boolean(s.panel))
  const abertura = useRef(gavetaAberta ? 1 : 0)

  const aplicar = useRef(() => {})
  aplicar.current = () => {
    const { width, height } = tamanho
    if (isMobile) {
      camera.aspect = width / Math.max(1, height)
      camera.clearViewOffset()
      camera.fov = fovVertical({ largura: width, altura: height, celular: true })
      camera.updateProjectionMatrix()
      invalidate()
      return
    }
    const t = abertura.current * abertura.current * (3 - 2 * abertura.current)
    const livre = Math.max(1, width - t * larguraDaGaveta())
    camera.fov = fovVertical({ largura: livre, altura: height, celular: false })
    camera.aspect = livre / Math.max(1, height)
    if (livre < width - 0.5) camera.setViewOffset(livre, height, 0, 0, width, height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
    // Com o loop em pausa (PausaQuandoNadaMexe) ninguem mais desenharia a lente
    // nova: a gaveta abria e a cena ficava onde estava.
    invalidate()
  }

  // Tamanho, modo, gaveta e movimento reduzido: recalcula na hora. O R3F repoe
  // `aspect` ao redimensionar; este efeito roda depois e devolve o da area livre.
  useEffect(() => {
    if (!isMobile && reduzida) abertura.current = gavetaAberta ? 1 : 0
    if (isMobile) abertura.current = 0
    aplicar.current()
  }, [camera, isMobile, tamanho, gavetaAberta, reduzida])

  // Abrir e fechar a gaveta: a area livre anda junto com a entrada dela, em vez
  // de a cena pular de lado. Com movimento reduzido o efeito acima ja cortou.
  useFrame((_, delta) => {
    const alvo = gavetaAberta ? 1 : 0
    if (abertura.current === alvo) return
    const passo = Math.min(delta, 0.05) / GAVETA_SEGUNDOS
    abertura.current =
      alvo > abertura.current ? Math.min(alvo, abertura.current + passo) : Math.max(alvo, abertura.current - passo)
    aplicar.current()
  })

  return null
}

// O navegador in-app (WKWebView) derruba o contexto ao voltar de outro app — e
// a saida principal deste site e justamente ir ao WhatsApp e voltar. Sem isto,
// a cena fica preta atras do menu, sem aviso nenhum.
function GuardaContexto() {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    const tela = gl.domElement
    const perdeu = (e) => {
      e.preventDefault()
      useStore.getState().setGl3d('perdido')
    }
    const voltou = () => {
      useStore.getState().setGl3d('ok')
      // O mapa de sombra congelado (Sombra) voltou vazio junto com o contexto.
      gl.shadowMap.needsUpdate = true
      invalidate()
    }

    tela.addEventListener('webglcontextlost', perdeu)
    tela.addEventListener('webglcontextrestored', voltou)
    return () => {
      // Sair para o modo lista desmonta o Canvas, e o R3F derruba o contexto ao
      // descartar o renderer. Sem tirar o ouvinte antes, essa perda planejada
      // acendia a faixa de "o 3D parou de desenhar" numa pagina sem 3D nenhum.
      tela.removeEventListener('webglcontextlost', perdeu)
      tela.removeEventListener('webglcontextrestored', voltou)
    }
  }, [gl, invalidate])

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

  useFrame((state, delta) => {
    const a = acc.current
    // Loop em pausa (PausaQuandoNadaMexe): os quadros avulsos que os controles e
    // o toque pedem chegam separados pelo tempo parado — 200 ms entre dois deles
    // e a pessoa olhando, nao um aparelho a 5 fps. Nao entram na conta.
    if (state.frameloop !== 'always') {
      a.tempos = []
      a.janela = 0
      return
    }
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

/**
 * Para de desenhar quando nao ha nada novo para mostrar. Pausado, o loop so
 * desenha quando alguem pede: os controles da camera pedem sozinhos, e quem
 * muda a cena por fora de um quadro pede com `invalidate()` (a lente em
 * CameraFov, o `setLookAt` sem transicao em CameraRig, a peca que interpola em
 * CeramicPiece, o brilho do toque em Quadros). Dois casos:
 *
 * No celular, com a folha aberta, a cena fica atras de 84% da tela e continuava
 * desenhando sem parar — medido: 21 renders por segundo com o orcamento aberto e
 * parado (num celular de verdade, ate 60), bateria e calor enquanto a pessoa
 * preenche o formulario (raio-x de 15/09, P10). Depois do voo da camera ate o
 * lugar do painel, pausa; fechou, volta ao normal. No desktop a gaveta deixa a
 * cena a vista, e nada muda.
 *
 * Com movimento reduzido, depois de entrar: poeira, respiro da camera, pulso das
 * molduras, gato e vento ja param nesse modo, entao o quadro sai IDENTICO ao
 * anterior — e o loop seguia desenhando 40 a 46 vezes por segundo (medido na
 * producao, 375 parado). Antes de entrar o carregador precisa dos quadros
 * (SceneReady, Sombra), por isso a espera pelo `entered`.
 *
 * Limite conhecido: com a camera encostada numa parede (colisor), o
 * camera-controls quer voltar a distancia pedida, a parede nao deixa, e ele
 * emite 'update' a cada quadro sem mover nada. Ai a pausa nao pausa — o mesmo
 * custo de antes, sem piora. Resolver mexeria no jeito elastico de a camera
 * voltar ao se afastar da parede.
 *
 * A pausa sobe para o Experience em vez de chamar `setFrameloop` daqui: o Canvas
 * reaplica o prop `frameloop` a cada render, e sem o prop o padrao e 'always'.
 * Qualquer render do Experience — o degrau 1 do PerfWatch, por exemplo — desfazia
 * a pausa em silencio, e o efeito abaixo nao rodava de novo (visto na sonda: com
 * o dpr ja em 0,75, o loop ficou em 'always' do comeco ao fim).
 */
function PausaQuandoNadaMexe({ aoPausar }) {
  const isMobile = useIsMobile()
  const reduzido = useReducedMotion()
  const entered = useStore((s) => s.entered)
  const painelAberto = useStore((s) => Boolean(s.panel))
  const pausar = (isMobile && painelAberto) || (reduzido && entered)

  useEffect(() => {
    if (!pausar) {
      aoPausar(false)
      return
    }
    const id = setTimeout(() => aoPausar(true), 1200)
    return () => clearTimeout(id)
  }, [pausar, aoPausar])

  return null
}

// memo: o Experience renderiza de novo quando a pausa liga e desliga, e sem isto
// a cena inteira renderizaria junto — logo no fechar da folha, com a animacao
// dela na tela.
const Scene = memo(function Scene({ quality, aoBaixarDpr, aoPausar }) {
  const alta = quality === 'alta'
  // Com `prefers-reduced-motion`, a poeira para de flutuar — mas continua na
  // tela. Medido: com reducao pedida e o vento das plantas ja em zero, 1,43%
  // dos pixels ainda mudavam a cada 700 ms; escondendo este unico `Points` da
  // cena a diferenca ia a ZERO, e devolvendo-o voltava a 1,48%. Era a unica
  // coisa que ainda animava contra o pedido de quem navega assim.
  // Parar em vez de sumir segue a decisao que o projeto ja tomou nos outros
  // quatro lugares — o pulso do marcador, por exemplo, vira anel estatico.
  const reduzido = useReducedMotion()

  // O conteudo da cena monta numa TRANSICAO. Montar tudo de uma vez era uma
  // tarefa unica na linha principal: medido na producao, celular 375 com CPU 4x
  // mais lenta, uma tarefa de 6,7 s e ~16 s de bloqueio somado ate o "Entrar".
  // Nesse tempo o toque em "ver o catalogo como lista" — a saida de quem tem
  // aparelho lento — so era atendido 9 a 10 s depois. O perfil mostrou que o
  // grosso e construir geometria no render de cada peca e de cada planta; numa
  // transicao a raiz do R3F (concorrente) fatia esse trabalho entre componentes
  // e atende o toque no meio. Tudo acontece atras do carregador.
  // Montam JUNTO com o conteudo, e nao antes: CameraRig (le as paredes-colisor ao
  // montar), Sombra (congela o mapa depois de 45 quadros — da cena vazia, as
  // pecas nunca teriam sombra), SceneReady (liberaria o "Entrar" com a cena vazia)
  // e PerfWatch (mediria os quadros engasgados da montagem e rebaixaria o
  // aparelho).
  const [montar, setMontar] = useState(false)
  useEffect(() => {
    startTransition(() => setMontar(true))
  }, [])

  return (
    <>
      <color attach="background" args={['#1c1512']} />
      <fogExp2 attach="fog" args={['#241b16', 0.042]} />
      <CameraFov />
      <GuardaContexto />
      <PausaQuandoNadaMexe aoPausar={aoPausar} />

      {montar && (
        <>
          <Lighting quality={quality} />
          <Atelier />
          <WorkTable quality={quality} />
          <Shelf quality={quality} />
          <Pinboard />
          {/* Suspense CURTO, so em volta das fotos. A cena inteira nao pode
              suspender: o SceneReady vive aqui do lado, e se o useFrame dele parar
              enquanto as imagens chegam, `assetsReady` nunca dispara e quem chegou
              fica presa no loader para sempre. Assim o comodo aparece completo e as
              molduras entram quando as fotos terminam de carregar. */}
          <FotoOpcional>
            <Suspense fallback={null}>
              <Quadros />
            </Suspense>
          </FotoOpcional>
          <Plants quality={quality} />
          {/* O gato entra depois das plantas porque divide o canto com elas: a
              posicao dele foi escolhida medindo a distancia ate a `costela-fundo`,
              que eu tinha acabado de levantar. */}
          <Gato />
          <Hotspots />

          {/* Poeira no facho de luz. Fica no caminho que o sol de verdade faz —
              do vao da janela (1.34, 1.72, -1.7) ate a bancada (0.5, 0.78, 0) —
              e nao num ponto qualquer: fora do facho nao haveria luz para revelar. */}
          <Sparkles
            count={alta ? 70 : 24}
            scale={[1.4, 1.3, 1.9]}
            position={[0.92, 1.26, -0.85]}
            size={alta ? 2.2 : 1.6}
            speed={reduzido ? 0 : 0.22}
            opacity={0.5}
            color="#ffe6c0"
          />

          <CameraRig />
          <SceneReady />
          <Sombra />
          <PerfWatch aoBaixarDpr={aoBaixarDpr} />
        </>
      )}
    </>
  )
})

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
  const teto = tetoDpr ?? (quality === 'alta' ? 1.75 : 1.25)
  // Degrau 1 do PerfWatch: menos pixel DE VERDADE. O teto ia a 1 com o piso
  // tambem em 1, e em tela de dpr 1 — a maioria dos notebooks — nada mudava:
  // medido em 1440 com Intel UHD, o dpr seguia 1, o quadro em 50 ms, e aos 41 s
  // vinha o degrau 2 (qualidade baixa, que quase nao alivia: o custo e
  // resolucao — GPU 38,7 ms, 20,9 com meio dpr — e nao luz nem sombra) com o
  // aviso "a cena esta pesada". Agora e 75% do dpr em uso, com piso abaixo de 1.
  const baixarDpr = useCallback(() => {
    const emUso = Math.min(Math.max(1, window.devicePixelRatio || 1), teto)
    setTetoDpr(Math.min(1, emUso * 0.75))
  }, [teto])
  // Ver PausaQuandoNadaMexe. `setPausado` e estavel, entao nao desfaz o memo da cena.
  const [pausado, setPausado] = useState(false)

  return (
    <Canvas
      // 'percentage' (PCF) e o que o three 0.186 usa de qualquer jeito: o
      // PCFSoftShadowMap de 'soft' foi removido e so gerava aviso no console.
      // A borda macia vem de shadow-radius, no Lighting.
      shadows={quality === 'alta' ? 'percentage' : false}
      dpr={[Math.min(1, teto), teto]}
      frameloop={pausado ? 'demand' : 'always'}
      // Coerente porque o nivel do aparelho nao muda depois de criado o
      // renderer. Em aparelho de toque, 'default' deixa o sistema escolher a
      // GPU integrada, que gasta menos bateria e aquece menos.
      gl={{
        antialias: aparelho === 'alta',
        powerPreference: aparelho === 'alta' ? 'high-performance' : 'default',
      }}
      // Em retrato o campo horizontal encolhe muito: um fov maior evita
      // ter de afastar a camera ate a cena virar uma maquete distante.
      camera={{ position: [0.22, 1.66, 2.5], fov: isMobile ? 54 : 38, near: 0.08, far: 30 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
    >
      <Scene quality={quality} aoBaixarDpr={baixarDpr} aoPausar={setPausado} />
    </Canvas>
  )
}
