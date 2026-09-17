import { useState } from 'react'
import { hotspots } from '../data/scene'
import { products } from '../data/products'
import { studio } from '../data/studio'
import { useIsMobile } from '../hooks/useMedia'
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

// Ref dos cartoes ancorados embaixo no celular (card de destaque e barra de peca):
// publica a altura deles em --ancora-baixo para os avisos subirem acima. Adicionar
// pela barra de peca e o caminho de compra do 3D, e o aviso "Lembrancinha...: 20 un"
// caia em cima do nome e do preco que ele confirma — medido em 375: 4.142 px2 de
// letra cobertos por 2,6 s, com o preco cortado ao meio.
// offsetHeight e nao getBoundingClientRect: a entrada anima com transform.
// Funcao de modulo, identidade estavel: o React chama uma vez ao montar e a
// limpeza (React 19) ao desmontar.
function ancorarEmbaixo(el) {
  if (!el) return
  const raiz = document.documentElement
  const observador = new ResizeObserver(() => raiz.style.setProperty('--ancora-baixo', `${el.offsetHeight}px`))
  observador.observe(el)
  return () => {
    observador.disconnect()
    raiz.style.removeProperty('--ancora-baixo')
  }
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
  // Quadro em close esconde o card pelo mesmo motivo que peca em destaque ja
  // escondia: quem clicou numa foto quer VER a foto, e o card cobre o terco de
  // baixo da tela. Faltava so o quadro na lista — era inconsistencia, nao
  // decisao.
  const quadroFocado = useStore((s) => s.quadroFocado)
  // Fora da visao geral o card tambem sai, pelo mesmo motivo do quadro em close:
  // quem foi ate a estante quer VER a estante. Medido na `prateleira` em 1440, o
  // card cobria a etiqueta "Lembrancinha Vasinho de Flor · a partir de R$ 12" —
  // preco escondido na vista que vende. O tour ja escondia o card em todas as
  // vistas; faltava a navegacao comum fazer igual.
  // `view` comeca em 'home' no store, entao quem acabou de entrar segue vendo o
  // card.
  const view = useStore((s) => s.view)
  const openPanel = useStore((s) => s.openPanel)
  const [fechado, setFechado] = useState(false)

  if (
    !entered ||
    !onboardingDone ||
    panel ||
    focusedProduct ||
    quadroFocado ||
    view !== 'home' ||
    tourStep >= 0 ||
    fechado
  )
    return null

  return (
    <div
      ref={ancorarEmbaixo}
      className="anim-sobe fixed right-3 bottom-[calc(4.4rem_+_var(--sobra-area-segura))] left-3 z-20 md:right-auto md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:left-[max(1.25rem,env(safe-area-inset-left))] md:max-w-[22rem] camada-cena"
    >
      <div
        className="relative rounded-2xl bg-porcelana/95 p-3 shadow-[var(--shadow-painel)] md:p-4"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        {/* X em 44x44 (media 27x27, o menor alvo fora de painel). Sem fundo em
            repouso: -top-0.5 -right-0.5 mantem o centro do icone a 20 px do canto
            (era 19,5), entao ele fica no mesmo lugar. E a area maior nao cobre
            letra do titulo: medido contra as linhas de texto, 0 px2 — em 375 a
            primeira linha termina 6 px antes da caixa do X. */}
        <button
          type="button"
          onClick={() => setFechado(true)}
          aria-label="Fechar apresentação"
          className="absolute -top-0.5 -right-0.5 grid h-11 w-11 place-items-center rounded-full text-carvao/55 hover:bg-carvao/6 hover:text-carvao"
        >
          <IconClose size={15} />
        </button>

        <p className="pr-7 font-display text-[15px] leading-snug text-carvao md:text-[18px]">
          Peças de porcelana fria, modeladas à mão sob encomenda
        </p>
        <p className="mt-1 pr-2 text-[11.5px] leading-snug text-carvao/70 md:mt-1.5 md:text-[12.5px] md:leading-relaxed">
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
    <div
      ref={ancorarEmbaixo}
      className="anim-sobe fixed right-3 bottom-[calc(4.4rem_+_var(--sobra-area-segura))] left-3 z-20 md:right-auto md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:left-[max(1.25rem,env(safe-area-inset-left))] md:max-w-[24rem] camada-cena"
    >
      <div
        className="relative rounded-2xl bg-porcelana/95 p-3 shadow-[var(--shadow-painel)]"
        style={{ backdropFilter: 'blur(6px)' }}
      >
        {/* Mesmo conserto do X do card de destaque: 27x27 -> 44x44, sem fundo em
            repouso; o -top/-right mantem o centro do icone no canto. */}
        <button
          type="button"
          onClick={clearFocus}
          aria-label="Parar de destacar a peça"
          className="absolute -top-0.5 -right-0.5 grid h-11 w-11 place-items-center rounded-full text-carvao/55 hover:bg-carvao/6 hover:text-carvao"
        >
          <IconClose size={15} />
        </button>

        {/* pr-8 (era pr-7): o espaco reservado para o X tem de acompanhar o X. Com
            ele em 44, a area de toque entra 30 px no conteudo pela direita, e os 28
            do pr-7 deixavam a ultima letra de um nome longo 2 px embaixo dela.
            Medido no desktop, onde a barra se ajusta ao nome: 34 px2 (2 x 17). */}
        <p className="pr-8 text-[14px] leading-snug font-medium text-carvao">{product.name}</p>
        <p className="mt-0.5 text-[13px] font-semibold text-brasa-texto">{priceLabel(product)}</p>

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
  const vistaLivre = useStore((s) => s.vistaLivre)
  const quadroFocado = useStore((s) => s.quadroFocado)

  if (!entered) return null

  // Sem cena desenhando, dizer onde a camera esta e oferecer "voltar para a
  // visao geral" e mentira: nao ha nada para ver. Fica so a saida para a lista.
  const desenhando = gl3d === 'ok'

  const peca = focusedProduct ? products.find((p) => p.id === focusedProduct)?.name : null
  // Quem arrastou nao esta mais no enquadramento do preset nem em cima da
  // peca. Afirmar o contrario era o que deixava a pessoa perdida sem saber.
  // Foto em close vem antes da peca e da vista, na mesma ordem do CameraRig. Sem
  // ela, a foto tocada a partir da visao geral dizia "Ateliê" e escondia o botao
  // de casa (a vista seguia 'home'): medido em 375, a unica saida visivel era a
  // aba "Ateliê", que ja parecia selecionada.
  const lugar = vistaLivre ? 'Vista livre' : quadroFocado ? 'Foto de perto' : (peca ?? LUGARES[view] ?? LUGARES.home)
  const lugarCurto = vistaLivre ? 'Vista livre' : quadroFocado ? 'Foto' : (peca ?? LUGARES_CURTO[view] ?? LUGARES_CURTO.home)

  return (
    <div className="camada-cena fixed top-[3.4rem] left-[max(0.75rem,env(safe-area-inset-left))] z-20 flex items-center gap-1 md:top-[4.4rem] md:left-[max(1.25rem,env(safe-area-inset-left))]">
      {desenhando && (
        <>
          {/* Texto cheio, e nao a 90%: sobre as partes claras da cena (mural no
              celular, quadro da parede direita no desktop) o fundo real da tela
              — cena, degrade do cabecalho e vinheta — deixava 4,53:1, no limite.
              Cheio da 5,18 no mesmo fundo. Mesmo ajuste que o menu ja recebeu. */}
          <span
            className="max-w-[9.5rem] truncate rounded-full bg-carvao/55 px-3 py-1.5 text-[11.5px] font-medium text-porcelana md:max-w-none"
            style={{ backdropFilter: 'blur(6px)' }}
          >
            <span className="md:hidden">{lugarCurto}</span>
            <span className="hidden md:inline">{lugar}</span>
          </span>

          {(view !== 'home' || vistaLivre || quadroFocado) && (
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
    <div className="camada-cena anim-sobe fixed bottom-[calc(4.75rem_+_var(--sobra-area-segura))] left-3 right-3 z-30 md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:left-1/2 md:right-auto md:w-[30rem] md:-translate-x-1/2">
      <div className="rounded-2xl bg-porcelana/96 p-4 shadow-[var(--shadow-painel)]" style={{ backdropFilter: 'blur(6px)' }}>
        <div className="flex items-center gap-2">
          <IconSparkle size={16} className="text-brasa" />
          <span className="text-[11px] font-semibold tracking-wide text-brasa-texto uppercase">
            Tour · {tourStep + 1} de {hotspots.length}
          </span>
          {/* 44 de altura (media 28,5: texto de 12,5 px com line-height 1, mais o
              py-2), sem fundo em repouso. O -my de 7,75 px devolve exatamente o que
              a caixa ganhou (44 - 15,5 = 28,5), para a barra do tour nao mudar de
              altura. Com 7,5 px — conta feita sobre o 29 arredondado — ela crescia
              0,5 px: medido, 161,5 -> 162. */}
          <button
            type="button"
            onClick={stopTour}
            className="btn-fantasma -my-[7.75px] ml-auto -mr-2 min-h-11 text-[12.5px]"
          >
            Encerrar
          </button>
        </div>

        <p className="mt-1.5 font-display text-[17px] text-carvao">{spot.title}</p>
        <p className="mt-0.5 text-[13px] text-carvao/70">{spot.hint}</p>

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
    // Na faixa livre entre o cabecalho e a estante, junto da barra de
    // orientacao. No topo centralizado ele cobria a tabua de cima (arranjo,
    // pilha de pratos, mini arranjo, potinho) e embaixo cobria as etiquetas de
    // preco da tabua de baixo — medido, 416 x 61 px. Na vista da prateleira a
    // estante vai de y 192 a 815: quem avisa nao pode tapar o produto.
    <div
      role="status"
      className="camada-cena anim-sobe fixed top-[6.1rem] left-3 z-[44] w-[min(22rem,calc(100vw-1.5rem))] md:top-[7.2rem] md:left-5"
    >
      <div className="cartao flex items-start gap-3 p-3.5">
        <IconLayers size={19} className="mt-0.5 shrink-0 text-brasa" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-carvao">A cena está pesada neste aparelho</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-carvao/70">
            Posso mostrar o mesmo conteúdo em lista, que abre leve e rola normal.
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSimpleMode(true)
                dismissLowPerf()
              }}
              className="btn-secundario px-3.5 py-2 text-[12.5px]"
            >
              Ver em lista
            </button>
            {/* Mesmo peso do outro: e um aviso, nao um bloqueio. Quem esta
                vendo a cena rodar decide se ela esta boa o bastante. */}
            <button
              type="button"
              onClick={dismissLowPerf}
              className="btn-secundario px-3.5 py-2 text-[12.5px]"
            >
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
  const segurarAviso = useStore((s) => s.segurarAviso)
  const soltarAviso = useStore((s) => s.soltarAviso)
  // Gaveta aberta no desktop: o aviso centraliza na area LIVRE, como a camera
  // (lente.js). Centralizado na tela inteira, em 768 ele nascia sobre o botao
  // "Adicionar ao pedido" que acabara de ser clicado (1.589 px2 de letra).
  // 28rem = w-[27rem] + right-4 da gaveta em Panel.jsx.
  const painelAberto = useStore((s) => Boolean(s.panel))
  const isMobile = useIsMobile()
  const gavetaAberta = painelAberto && !isMobile

  // Sempre montado, mesmo vazio: uma regiao viva so e anunciada de forma
  // confiavel se ja existia no DOM quando o texto chega. Montada junto com o
  // aviso, o leitor de tela costuma perder a primeira mensagem — e aqui a
  // primeira mensagem e "20 un (minimo do pedido) · R$ 240".
  // No celular: o maior entre o lugar de sempre, 0,5rem acima do cartao ancorado
  // (ver ancorarEmbaixo) e 0,5rem acima da folha aberta (--folha-altura, Panel).
  // Sem cartao nem folha, as variaveis nao existem e vale o de sempre.
  // De 768 a 1023 (iPad em pe) o aviso centralizado alcanca o cartao do canto
  // esquerdo: cobria o "Adicionar" da barra de peca (949 px2). Ali ele tambem
  // sobe acima do cartao. De 1024 para cima nao cruza (medido: 0 px2).
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-[max(calc(8.5rem_+_var(--sobra-area-segura)),calc(4.4rem_+_var(--sobra-area-segura)_+_var(--ancora-baixo,0px)_+_0.5rem),calc(var(--folha-altura,0px)_+_0.5rem))] left-1/2 z-[46] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col items-center gap-2 md:bottom-6 md:max-lg:bottom-[max(1.5rem,calc(1.75rem_+_var(--ancora-baixo,-0.25rem)))] ${
        gavetaAberta ? 'md:left-[calc(50%-14rem)] md:max-w-[calc(100vw-30rem)]' : ''
      }`}
    >
      {toasts.map((t) => (
        <span
          key={t.id}
          className="anim-sobe flex max-w-full items-center gap-3 rounded-full bg-carvao px-4 py-2.5 text-[13px] font-medium text-porcelana shadow-lg"
        >
          <span className="min-w-0">{t.texto}</span>
          {t.acao && (
            // O conteiner ignora ponteiro para nao roubar clique da cena; o
            // botao precisa receber de volta, senao o desfazer nao clica.
            <button
              type="button"
              onClick={t.acao.aoClicar}
              onMouseEnter={() => segurarAviso(t.id)}
              onMouseLeave={() => soltarAviso(t.id)}
              onFocus={() => segurarAviso(t.id)}
              onBlur={() => soltarAviso(t.id)}
              className="pointer-events-auto -mr-1.5 shrink-0 rounded-full px-2 py-0.5 font-semibold text-brasa-clara underline underline-offset-2"
            >
              {t.acao.rotulo}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}
