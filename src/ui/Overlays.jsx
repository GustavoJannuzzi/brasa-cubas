import { useState } from 'react'
import { hotspots } from '../data/scene'
import { products } from '../data/products'
import { studio } from '../data/studio'
import { money, priceLabel } from '../lib/format'
import { useStore } from '../store/useStore'
import { IconArrow, IconClose, IconEye, IconEyeOff, IconHome, IconLayers, IconSparkle } from './Icons'

const PRECO_MINIMO = Math.min(...products.map((p) => p.price))

const LUGARES = {
  home: 'Visão geral do ateliê',
  mesa: 'A bancada',
  prateleira: 'A prateleira',
  orcamento: 'O caderno de pedidos',
  galeria: 'O mural de fotos',
  contato: 'O telefone do ateliê',
}

// Em tela estreita o nome comprido empurra os botoes da barra para fora.
const LUGARES_CURTO = {
  home: 'Ateliê',
  mesa: 'Bancada',
  prateleira: 'Prateleira',
  orcamento: 'Pedidos',
  galeria: 'Mural',
  contato: 'Telefone',
}

/**
 * Cartao de boas-vindas sobre a cena. E a resposta rapida para
 * "o que e este site e onde eu compro" — as duas perguntas que um site 3D
 * costuma deixar sem resposta.
 */
export function HeroCard() {
  const entered = useStore((s) => s.entered)
  const onboardingDone = useStore((s) => s.onboardingDone)
  const panel = useStore((s) => s.panel)
  const tourStep = useStore((s) => s.tourStep)
  const focusedProduct = useStore((s) => s.focusedProduct)
  const openPanel = useStore((s) => s.openPanel)
  const [fechado, setFechado] = useState(false)

  if (!entered || !onboardingDone || panel || focusedProduct || tourStep >= 0 || fechado) return null

  return (
    <div className="anim-sobe fixed right-3 bottom-[4.4rem] left-3 z-20 md:right-auto md:bottom-5 md:left-5 md:max-w-[22rem]">
      <div
        className="relative rounded-2xl bg-porcelana/95 p-3 shadow-[var(--shadow-painel)] md:p-4"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        <button
          type="button"
          onClick={() => setFechado(true)}
          aria-label="Fechar apresentação"
          className="absolute top-1.5 right-1.5 rounded-full p-1.5 text-carvao/35 hover:bg-carvao/6 hover:text-carvao"
        >
          <IconClose size={15} />
        </button>

        <p className="pr-7 font-display text-[15px] leading-snug text-carvao md:text-[18px]">
          Peças de porcelana fria, modeladas à mão sob encomenda
        </p>
        <p className="mt-1 pr-2 text-[11.5px] leading-snug text-carvao/65 md:mt-1.5 md:text-[12.5px] md:leading-relaxed">
          A partir de {money(PRECO_MINIMO)} · {studio.answerTime.toLowerCase()}
        </p>

        <div className="mt-2.5 flex gap-2 md:mt-3.5">
          <button
            type="button"
            onClick={() => openPanel('produtos')}
            className="btn-principal flex-1 px-3 py-2.5 text-[13px] md:px-4"
          >
            Ver produtos
          </button>
          <button
            type="button"
            onClick={() => openPanel('orcamento')}
            className="btn-secundario flex-1 px-3 py-2.5 text-[13px] md:px-4"
          >
            Pedir orçamento
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Aparece quando o usuario pediu "ver na prateleira": o painel some, a peca
 * fica destacada no 3D e esta faixa mantem preco e caminho de volta a vista.
 */
export function FocusedProductBar() {
  const focusedProduct = useStore((s) => s.focusedProduct)
  const panel = useStore((s) => s.panel)
  const openProduct = useStore((s) => s.openProduct)
  const addToCart = useStore((s) => s.addToCart)
  const clearFocus = useStore((s) => s.clearFocus)

  if (!focusedProduct || panel) return null
  const product = products.find((p) => p.id === focusedProduct)
  if (!product) return null

  return (
    <div className="anim-sobe fixed right-3 bottom-[4.4rem] left-3 z-20 md:right-auto md:bottom-5 md:left-5 md:max-w-[24rem]">
      <div
        className="relative rounded-2xl bg-porcelana/95 p-3 shadow-[var(--shadow-painel)]"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        <button
          type="button"
          onClick={clearFocus}
          aria-label="Parar de destacar a peça"
          className="absolute top-1.5 right-1.5 rounded-full p-1.5 text-carvao/35 hover:bg-carvao/6 hover:text-carvao"
        >
          <IconClose size={15} />
        </button>

        <p className="pr-7 text-[14px] leading-snug font-medium text-carvao">{product.name}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-brasa">{priceLabel(product)}</p>

        <div className="mt-2.5 flex gap-2">
          <button
            type="button"
            onClick={() => openProduct(product.id, { focus: false })}
            className="btn-secundario flex-1 px-3 py-2.5 text-[13px] whitespace-nowrap"
          >
            Ver detalhes
          </button>
          <button
            type="button"
            onClick={() => addToCart(product.id)}
            className="btn-principal flex-1 px-3 py-2.5 text-[13px] whitespace-nowrap"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}

/** Diz onde a camera esta e oferece a volta para a visao geral. */
export function OrientationBar() {
  const entered = useStore((s) => s.entered)
  const view = useStore((s) => s.view)
  const goTo = useStore((s) => s.goTo)
  const showHotspots = useStore((s) => s.showHotspots)
  const toggleHotspots = useStore((s) => s.toggleHotspots)
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const focusedProduct = useStore((s) => s.focusedProduct)
  const gl3d = useStore((s) => s.gl3d)

  if (!entered) return null

  // Sem cena desenhando, dizer onde a camera esta e oferecer "voltar para a
  // visao geral" e mentira: nao ha nada para ver. Fica so a saida para a lista.
  const desenhando = gl3d === 'ok'

  const peca = focusedProduct ? products.find((p) => p.id === focusedProduct)?.name : null
  const lugar = peca ?? LUGARES[view] ?? LUGARES.home
  const lugarCurto = peca ?? LUGARES_CURTO[view] ?? LUGARES_CURTO.home

  return (
    <div className="fixed top-[3.4rem] left-3 z-20 flex items-center gap-1 md:top-[4.4rem] md:left-5">
      {desenhando && (
        <>
          <span
            className="max-w-[9.5rem] truncate rounded-full bg-carvao/55 px-3 py-1.5 text-[11.5px] font-medium text-porcelana/90 md:max-w-none"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            <span className="md:hidden">{lugarCurto}</span>
            <span className="hidden md:inline">{lugar}</span>
          </span>

          {view !== 'home' && (
            <button
              type="button"
              onClick={() => goTo('home')}
              title="Voltar para a visão geral"
              aria-label="Voltar para a visão geral"
              className="grid h-8 w-8 place-items-center rounded-full bg-carvao/55 text-porcelana/80 transition-colors hover:text-porcelana"
              style={{ backdropFilter: 'blur(6px)' }}
            >
              <IconHome size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={toggleHotspots}
            title={showHotspots ? 'Esconder marcadores' : 'Mostrar marcadores'}
            aria-label={showHotspots ? 'Esconder marcadores' : 'Mostrar marcadores'}
            className="hidden h-8 w-8 place-items-center rounded-full bg-carvao/55 text-porcelana/80 transition-colors hover:text-porcelana md:grid"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            {showHotspots ? <IconEyeOff size={16} /> : <IconEye size={16} />}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={toggleSimpleMode}
        title="Ver como lista, sem 3D"
        aria-label="Ver como lista, sem 3D"
        className="grid h-8 w-8 place-items-center rounded-full bg-carvao/55 text-porcelana/80 transition-colors hover:text-porcelana md:hidden"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        <IconLayers size={16} />
      </button>
    </div>
  )
}

export function TourBar() {
  const tourStep = useStore((s) => s.tourStep)
  const nextTourStep = useStore((s) => s.nextTourStep)
  const stopTour = useStore((s) => s.stopTour)
  const openPanel = useStore((s) => s.openPanel)

  if (tourStep < 0) return null
  const spot = hotspots[tourStep]
  if (!spot) return null

  const ultimo = tourStep === hotspots.length - 1

  return (
    <div className="anim-sobe fixed bottom-[4.75rem] left-3 right-3 z-30 md:bottom-5 md:left-1/2 md:right-auto md:w-[30rem] md:-translate-x-1/2">
      <div className="rounded-2xl bg-porcelana/96 p-4 shadow-[var(--shadow-painel)]" style={{ backdropFilter: 'blur(6px)' }}>
        <div className="flex items-center gap-2">
          <IconSparkle size={16} className="text-brasa" />
          <span className="text-[11px] font-semibold tracking-wide text-brasa uppercase">
            Tour · {tourStep + 1} de {hotspots.length}
          </span>
          <button type="button" onClick={stopTour} className="btn-fantasma ml-auto -mr-2 text-[12.5px]">
            Encerrar
          </button>
        </div>

        <p className="mt-1.5 font-display text-[17px] text-carvao">{spot.title}</p>
        <p className="mt-0.5 text-[13px] text-carvao/65">{spot.hint}</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              stopTour()
              openPanel(spot.panel)
            }}
            className="btn-secundario flex-1 px-4 py-2.5"
          >
            Abrir {spot.label.toLowerCase()}
          </button>
          <button type="button" onClick={nextTourStep} className="btn-principal flex-1 px-4 py-2.5">
            {ultimo ? 'Terminar' : 'Próximo'}
            <IconArrow size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function LowPerfBanner() {
  const lowPerf = useStore((s) => s.lowPerf)
  const dismissLowPerf = useStore((s) => s.dismissLowPerf)
  const setSimpleMode = useStore((s) => s.setSimpleMode)

  if (!lowPerf) return null

  return (
    <div className="anim-sobe fixed top-[3.4rem] left-1/2 z-[44] w-[min(26rem,calc(100vw-1.5rem))] -translate-x-1/2 md:top-[4.4rem]">
      <div className="cartao flex items-start gap-3 p-3.5">
        <IconLayers size={19} className="mt-0.5 shrink-0 text-brasa" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-carvao">A cena está pesada neste aparelho</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-carvao/65">
            Posso mostrar o mesmo conteúdo em lista, que abre leve e rola normal.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSimpleMode(true)
                dismissLowPerf()
              }}
              className="btn-principal px-3.5 py-2 text-[12.5px]"
            >
              Ver em lista
            </button>
            <button type="button" onClick={dismissLowPerf} className="btn-fantasma text-[12.5px]">
              Continuar em 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed bottom-[8.5rem] left-1/2 z-[46] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2 md:bottom-6">
      {toasts.map((t) => (
        <span
          key={t.id}
          className="anim-sobe rounded-full bg-carvao px-4 py-2.5 text-[13px] font-medium text-porcelana shadow-lg"
        >
          {t.text}
        </span>
      ))}
    </div>
  )
}
