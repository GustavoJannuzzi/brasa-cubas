import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { studio } from '../data/studio'
import { products } from '../data/products'
import { useStore } from '../store/useStore'
import { IconArrow, IconLayers } from './Icons'
import { PieceThumb } from './PieceThumb'

// Depois deste tempo sem o primeiro quadro, o loader para de esperar em
// silencio e oferece a lista como caminho principal. Em aparelho sem GPU (ou
// com renderizador por software) o quadro pode nunca vir.
const DEMORA = 12000

/**
 * Tela de entrada. Enquanto a cena monta, ela ja diz o que este site e e o
 * que da para fazer aqui — quem desistir antes de entrar sai sabendo.
 *
 * A barra nao finge progresso: ou esta indeterminada ("estou montando"), ou
 * cheia ("pronto"). A versao anterior subia sozinha ate 92% e parava la, o que
 * prometia que faltava pouco mesmo quando nada estava acontecendo.
 */
export function Loader() {
  const assetsReady = useStore((s) => s.assetsReady)
  const entered = useStore((s) => s.entered)
  const enter = useStore((s) => s.enter)
  const setSimpleMode = useStore((s) => s.setSimpleMode)
  const gl3d = useStore((s) => s.gl3d)
  const [demorou, setDemorou] = useState(false)

  useEffect(() => {
    if (assetsReady) return
    // flushSync: sem ele o aviso esperava a montagem da cena acabar. A atualizacao
    // vinda de um setTimeout entra na mesma fila de prioridade que a montagem (que
    // e uma transicao longa), e o agendador segue a montagem primeiro. Medido na
    // producao com CPU 4x: carregador na tela aos 2,8 s, pronto aos 17,6 s — e o
    // aviso nunca apareceu, nem no dev (pronto aos 27 s). So aparecia quando o
    // quadro nunca vinha. Isolado, com a cena ja montada, o mesmo relogio mostra o
    // aviso aos 12 s.
    const id = setTimeout(() => flushSync(() => setDemorou(true)), DEMORA)
    return () => clearTimeout(id)
  }, [assetsReady])

  if (entered) return null

  const pronto = assetsReady && gl3d === 'ok'
  const emApuros = (demorou && !pronto) || gl3d !== 'ok'

  const verLista = () => {
    setSimpleMode(true)
    enter()
  }

  // 'indisponivel' e 'perdido' sao coisas diferentes: dizer "este navegador nao
  // abre o 3D" para quem estava vendo a cena e ela caiu e falso, e manda a
  // pessoa embora achando que o aparelho dela nao serve.
  const status = pronto
    ? 'Ateliê pronto'
    : gl3d === 'indisponivel'
      ? 'Este navegador não abre o 3D'
      : gl3d === 'naoBaixou'
        ? 'Não deu para baixar o ateliê 3D agora'
        : gl3d === 'perdido'
        ? 'O 3D parou de desenhar'
        : demorou
          ? 'O 3D está demorando neste aparelho'
          : 'Montando o ateliê…'

  return (
    <div className="camada-cena fixed inset-0 z-50 flex flex-col items-center justify-center bg-carvao px-6 text-center">
      <div className="anim-sobe flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 flex gap-1.5">
          {products.slice(2, 5).map((p, i) => (
            <span key={p.id} style={{ opacity: pronto ? 1 : 0.35 + i * 0.1, transition: 'opacity .5s' }}>
              <PieceThumb piece={p.piece} size={i === 1 ? 74 : 58} />
            </span>
          ))}
        </div>

        <h1 className="font-display text-[34px] leading-none text-porcelana">{studio.name}</h1>
        <p className="mt-2 text-[14px] text-porcelana/70">
          {studio.tagline} · {studio.city}
        </p>
        <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-porcelana/55">
          {studio.pitch} Aqui você vê as peças, monta um pedido e pede orçamento — dentro do
          ateliê, em 3D.
        </p>

        {/* A marca dela respirando, no lugar da barra que corria de um lado ao
            outro. Mais leve, e diz "estou montando" sem fingir porcentagem —
            que era o motivo de a barra ser indeterminada. Pronta, ela para de
            respirar: a quietude e o aviso de que acabou. O respiro entra na
            lista do `prefers-reduced-motion` no CSS, como as outras. */}
        <div className="mt-8 grid place-items-center" aria-hidden="true">
          <span
            className={`grid h-9 w-9 place-items-center rounded-full bg-brasa text-porcelana ${
              pronto ? '' : 'anim-respira'
            }`}
          >
            <span className="font-display text-[15px] leading-none">bc</span>
          </span>
        </div>

        <p role="status" aria-live="polite" className="mt-3 text-[12.5px] text-porcelana/60">
          {status}
        </p>

        {emApuros ? (
          <>
            <button type="button" onClick={verLista} className="btn-principal mt-5 w-full max-w-64">
              <IconLayers size={16} />
              Ver o catálogo em lista
            </button>
            {gl3d === 'naoBaixou' ? (
              // "Continuar esperando" ficava desabilitado para sempre: o download
              // nao volta sozinho. Recarregar e a retentativa que funciona.
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-[12.5px] text-porcelana/50 underline underline-offset-2 hover:text-porcelana/80"
              >
                Tentar de novo
              </button>
            ) : (
              <button
                type="button"
                onClick={enter}
                disabled={!pronto}
                className="mt-3 text-[12.5px] text-porcelana/50 underline underline-offset-2 disabled:no-underline disabled:opacity-45 hover:text-porcelana/80"
              >
                {pronto ? 'Entrar no ateliê mesmo assim' : 'Continuar esperando o 3D'}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={enter}
              disabled={!pronto}
              className="btn-principal mt-5 w-full max-w-64 disabled:opacity-45"
            >
              {pronto ? 'Entrar no ateliê' : 'Preparando a bancada…'}
              {pronto && <IconArrow size={16} />}
            </button>

            <button
              type="button"
              onClick={verLista}
              className="mt-3 flex items-center gap-1.5 text-[12.5px] text-porcelana/50 underline underline-offset-2 hover:text-porcelana/80"
            >
              <IconLayers size={14} />
              ou ver o catálogo como lista, sem 3D
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const TELAS = [
  {
    titulo: 'Este é o ateliê da Isabela',
    texto:
      'Você está olhando a bancada onde as peças de porcelana fria são modeladas. Arraste para girar e olhar em volta.',
  },
  {
    titulo: 'Os pontos ✦ abrem as coisas',
    texto:
      'A prateleira tem os produtos com preço. O caderno abre o orçamento. O mural mostra o que já foi entregue.',
  },
  {
    titulo: 'Com pressa, use o menu',
    texto:
      'Produtos, orçamento e contato estão sempre a um toque, sem precisar explorar a cena. Nada é cobrado pelo site: o pedido vira conversa no WhatsApp.',
  },
]

export function Onboarding() {
  const entered = useStore((s) => s.entered)
  const onboardingDone = useStore((s) => s.onboardingDone)
  const pulouOnboarding = useStore((s) => s.pulouOnboarding)
  const finishOnboarding = useStore((s) => s.finishOnboarding)
  const startTour = useStore((s) => s.startTour)
  const [tela, setTela] = useState(0)
  const proximo = useRef(null)

  useEffect(() => {
    if (!onboardingDone) setTela(0)
  }, [onboardingDone])

  const naTela = entered && !onboardingDone && !pulouOnboarding

  useEffect(() => {
    // O foco entra no dialogo em vez de ficar no fundo, que agora esta inerte.
    if (naTela) proximo.current?.focus()
  }, [naTela, tela])

  useEffect(() => {
    if (!naTela) return
    // Esc fecha, como em qualquer caixa modal. Aqui fechar e "Pular".
    const onKey = (e) => {
      if (e.key === 'Escape') finishOnboarding()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [naTela, finishOnboarding])

  if (!naTela) return null

  const ultima = tela === TELAS.length - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-titulo"
      className="camada-cena fixed inset-0 z-[45] flex items-end justify-center bg-carvao/45 p-4 md:items-center"
    >
      <div className="anim-sobe w-full max-w-md rounded-2xl bg-porcelana p-5 shadow-[var(--shadow-painel)]">
        <span className="text-[11px] font-semibold tracking-wide text-brasa-texto uppercase">
          {tela + 1} de {TELAS.length}
        </span>
        <h2 id="onboarding-titulo" className="mt-1.5 text-[20px] leading-snug">
          {TELAS[tela].titulo}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-carvao/70">{TELAS[tela].texto}</p>

        {ultima && (
          <button
            type="button"
            onClick={() => {
              finishOnboarding()
              startTour()
            }}
            className="mt-3 text-[13px] font-medium text-brasa-texto underline underline-offset-2"
          >
            Prefiro um tour guiado pelos cinco pontos
          </button>
        )}

        <div className="mt-5 flex items-center gap-3">
          <div className="flex gap-1.5">
            {TELAS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === tela ? 'w-5 bg-brasa' : 'w-1.5 bg-carvao/20'}`}
              />
            ))}
          </div>
          <button type="button" onClick={finishOnboarding} className="btn-fantasma ml-auto text-[13px]">
            Pular
          </button>
          <button
            ref={proximo}
            type="button"
            onClick={() => (ultima ? finishOnboarding() : setTela(tela + 1))}
            className="btn-principal"
          >
            {ultima ? 'Entendi' : 'Próximo'}
            <IconArrow size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
