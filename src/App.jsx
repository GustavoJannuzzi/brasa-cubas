import { Suspense, useEffect, useState } from 'react'
import { useRotaHash } from './hooks/useRotaHash'
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
        {/* Na lista so vale avisar que o aparelho nao abre o 3D. Dizer que ele
            "parou de desenhar" para quem escolheu a lista e assustar sem
            motivo: nao ha cena nenhuma nesta pagina. */}
        {gl3d === 'indisponivel' && <Aviso3D />}
        <Toasts />
      </>
    )
  }

  return (
    <>
      {gl3d !== 'indisponivel' && (
        <Boundary3D
          key={tentativa}
          onErro={() => {
            setGl3d('perdido')
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
      <OrientationBar />
      <HeroCard />
      <FocusedProductBar />
      <TourBar />
      <MobileNav />

      <PainelAtivo />

      <Aviso3D
        onTentarDeNovo={() => {
          setGl3d('ok')
          setTentativa((n) => n + 1)
        }}
      />
      <LowPerfBanner />
      <Onboarding />
      <Loader />
      <Toasts />
    </>
  )
}
