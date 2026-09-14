import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { Experience } from './three/Experience'
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

  useEffect(() => {
    // O CSS usa isso para devolver a rolagem normal da pagina no modo simples.
    document.body.dataset.modo = simpleMode ? 'simples' : 'atelie'
  }, [simpleMode])

  if (simpleMode) {
    return (
      <>
        <SimpleMode />
        <PainelAtivo />
        <Toasts />
      </>
    )
  }

  return (
    <>
      <Experience />
      <div className="vinheta" aria-hidden="true" />

      <Header />
      <OrientationBar />
      <HeroCard />
      <FocusedProductBar />
      <TourBar />
      <MobileNav />

      <PainelAtivo />

      <LowPerfBanner />
      <Onboarding />
      <Loader />
      <Toasts />
    </>
  )
}
