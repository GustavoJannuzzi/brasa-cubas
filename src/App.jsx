import { Suspense, useEffect, useState } from 'react'
import { useIsMobile } from './hooks/useMedia'
import { useRotaHash } from './hooks/useRotaHash'
import { studio } from './data/studio'
import { temWebGL } from './lib/webgl'
import { useStore } from './store/useStore'
import { Experience } from './three/experienceLazy'
import { Aviso3D } from './ui/Aviso3D'
import { Boundary3D } from './ui/Boundary3D'
import { Header, MobileNav } from './ui/Header'
import { Loader, Onboarding } from './ui/Intro'
import {
  FocusedProductBar,
  HeroCard,
  LowPerfBanner,
  OrientationBar,
  Toasts,
  TourBar,
} from './ui/Overlays'
import { SimpleMode } from './ui/SimpleMode'
import { CartPanel } from './ui/panels/CartPanel'
import { ContactPanel } from './ui/panels/ContactPanel'
import { GalleryPanel } from './ui/panels/GalleryPanel'
import { HelpPanel } from './ui/panels/HelpPanel'
import { ProcessPanel } from './ui/panels/ProcessPanel'
import { ProductDetail } from './ui/panels/ProductDetail'
import { ProductsPanel } from './ui/panels/ProductsPanel'
import { QuotePanel } from './ui/panels/QuotePanel'

const PANELS = {
  produtos: ProductsPanel,
  produto: ProductDetail,
  orcamento: QuotePanel,
  galeria: GalleryPanel,
  processo: ProcessPanel,
  contato: ContactPanel,
  carrinho: CartPanel,
  ajuda: HelpPanel,
}

function PainelAtivo() {
  const panel = useStore((s) => s.panel)
  const Componente = panel ? PANELS[panel] : null
  return Componente ? <Componente /> : null
}

export default function App() {
  const simpleMode = useStore((s) => s.simpleMode)
  const gl3d = useStore((s) => s.gl3d)
  const setGl3d = useStore((s) => s.setGl3d)
  const setSimpleMode = useStore((s) => s.setSimpleMode)
  const setAssetsReady = useStore((s) => s.setAssetsReady)
  // Trocar esta chave remonta o Canvas: e o "tentar de novo" depois de o
  // contexto WebGL cair.
  const [tentativa, setTentativa] = useState(0)

  // O painel aberto vira endereco (#orcamento, #produto/topo-casal-jardim):
  // o voltar do navegador fecha o painel em vez de sair do site, e da para
  // mandar um link que abre direto no orcamento ou numa peca.
  useRotaHash()

  const entered = useStore((s) => s.entered)
  const panel = useStore((s) => s.panel)
  const onboardingDone = useStore((s) => s.onboardingDone)
  const pulouOnboarding = useStore((s) => s.pulouOnboarding)
  const isMobile = useIsMobile()

  // Camadas que cobrem a tela inteira. Enquanto uma delas esta aberta, o fundo
  // nao pode receber foco: quem usa teclado comecava tabulando por botoes
  // invisiveis atras do loader e abria painel que nao estava vendo.
  const onboardingNaTela = entered && !onboardingDone && !pulouOnboarding
  const folhaDoCelular = isMobile && Boolean(panel)
  const fundoInerte = !entered || onboardingNaTela || folhaDoCelular

  useEffect(() => {
    // O CSS usa isso para devolver a rolagem normal da pagina no modo simples.
    document.body.dataset.modo = simpleMode ? 'simples' : 'atelie'
  }, [simpleMode])

  useEffect(() => {
    // Canvas com o contexto perdido nao fica transparente: o Chrome composita
    // um canvas opaco sem backing como BRANCO (medido), e o cabecalho, que e
    // texto claro, some. O CSS usa isto para esconder o canvas morto e deixar
    // aparecer o carvao do body — o mesmo fundo do loader.
    document.body.dataset.gl = gl3d
  }, [gl3d])

  useEffect(() => {
    // Antes de montar o Canvas: sem WebGL, o 3D nunca desenharia o primeiro
    // quadro e a pessoa ficaria presa no loader. Vai direto para a lista.
    if (temWebGL()) return
    setGl3d('indisponivel')
    setSimpleMode(true)
  }, [setGl3d, setSimpleMode])

  if (simpleMode) {
    return (
      <>
        <SimpleMode />
        <PainelAtivo />
        {/* Sem aviso de 3D aqui. Mesmo o "este navegador nao abre o 3D" ficava
            preso na tela, sem dispensar, e seu unico botao — "Ver em lista" —
            nao fazia nada, porque a lista ja e esta pagina. A propria lista e
            a resposta. */}
        <Toasts />
      </>
    )
  }

  return (
    <>
      {/* Tudo que fica ATRAS de uma camada modal vive neste involucro: com
          inert, o Tab nao entra aqui enquanto o loader, o onboarding ou a
          folha do celular estiverem abertos. */}
      <div inert={fundoInerte || undefined}>
        {gl3d !== 'indisponivel' && (
          <Boundary3D
            key={tentativa}
            onErro={(erro) => {
              // Pacote do 3D que nao baixou nao e cena quebrada: o navegador
              // memoriza a falha do import() (medido: a mesma URL segue falhando
              // depois que a rede volta), entao remontar nao adianta — so
              // recarregar. Mensagens de Chrome, Safari e Firefox.
              const naoBaixou = /dynamically imported module|Importing a module script failed/i.test(
                String(erro?.message),
              )
              setGl3d(naoBaixou ? 'naoBaixou' : 'perdido')
              setAssetsReady(true)
            }}
          >
            <Suspense fallback={null}>
              <Experience />
            </Suspense>
          </Boundary3D>
        )}
        <div className="vinheta" aria-hidden="true" />

        <Header />
        {/* Titulo e regiao principal para quem navega por leitor de tela. Medido:
            no atelie 3D, depois de entrar, a pagina nao tinha NENHUM titulo nem
            `main` — so cabecalho e menu; com um painel aberto, so um h2. O modo
            lista ja tinha h1, h2, h3 e main. O `main` envolve so este trecho
            continuo, sem mudar a ordem do DOM (a tabulacao e o foco de reserva
            dependem dela), e tudo aqui e fixo: o involucro nao mexe no layout. */}
        <main>
          <h1 className="sr-only">
            {studio.name} — {studio.tagline}
          </h1>
          <OrientationBar />
          <HeroCard />
          <FocusedProductBar />
          <TourBar />
        </main>
        <MobileNav />

      </div>

      {/* Camadas de topo, fora do involucro inerte. Aviso3D e LowPerfBanner
          desenham POR CIMA do painel; dentro do inert eles apareciam no
          celular com um painel aberto mas com os botoes mortos — e o alerta
          de contexto perdido, que e justamente o caso de quem volta do
          WhatsApp, nunca era anunciado. */}
      <Aviso3D
        onTentarDeNovo={() => {
          if (gl3d === 'naoBaixou') {
            window.location.reload()
            return
          }
          setGl3d('ok')
          setTentativa((n) => n + 1)
        }}
      />
      <LowPerfBanner />
      {/* Antes de entrar, o painel tambem e fundo: com um link #orcamento o
          dialogo montava atras do loader e roubava o foco para um formulario
          invisivel. */}
      {entered && <PainelAtivo />}
      <Onboarding />
      <Loader />
      <Toasts />
    </>
  )
}
