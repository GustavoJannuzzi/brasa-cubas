import { useEffect, useMemo, useRef, useState } from 'react'
import { studio } from '../../data/studio'
import { daysUntil, formatDateBR, hojeISO, plural } from '../../lib/format'
import { diasDeReferencia, prazoDoTipo, prazoEmTexto, tetoDoPrazo } from '../../lib/prazo'
import { CONTATOS, quoteMailto, quoteMessage, quoteText } from '../../lib/whatsapp'
import { useStore } from '../../store/useStore'
import { IconAlert, IconArrow, IconBack, IconCheck, IconCopy, IconMail, IconWhatsapp } from '../Icons'
import { Panel } from '../Panel'

const TIPOS = [
  'Topo de bolo',
  'Arranjo de flores',
  'Lembrancinhas',
  'Boneco personalizado',
  'Peça decorativa',
  'Outra coisa',
]


const PASSOS = ['O que você precisa', 'Para quando', 'Como te encontro']

// "faltam 1 dias" era o que saia antes. Hoje e amanha nem se dizem com numero.
const quandoE = (dias) =>
  dias === 0 ? 'é hoje' : dias === 1 ? 'é amanhã' : `faltam ${plural(dias, 'dia', 'dias')}`

// Qual campo cobrar primeiro em cada passo, na ordem em que aparecem na tela.
const CAMPOS_DO_PASSO = { 0: ['kind', 'qty'], 2: ['name', 'contact'] }

/**
 * Mensagem de erro de um campo. Leva icone alem da cor — cor sozinha nao
 * comunica — e um id, para o campo aponta-la por aria-describedby e o leitor
 * de tela ler o motivo junto do campo.
 */
function Erro({ id, children }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-snug text-erro">
      <IconAlert size={14} className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  )
}

function Progresso({ step }) {
  const titulo = useRef(null)

  useEffect(() => {
    // Trocar de passo nao movia o foco nem anunciava nada: quem usa leitor de
    // tela apertava "Continuar" e nao sabia que tinha avancado, nem para onde.
    titulo.current?.focus({ preventScroll: true })
  }, [step])

  return (
    <div className="mb-4">
      {/* Invisivel na tela: quem enxerga ja tem a barra e o rotulo do passo. */}
      <h3 ref={titulo} tabIndex={-1} className="sr-only outline-none">
        Passo {step + 1} de {PASSOS.length}: {PASSOS[step]}
      </h3>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-semibold tracking-wide text-carvao/70 uppercase">
          Passo {step + 1} de {PASSOS.length}
        </span>
        <span className="text-[12.5px] font-medium text-carvao/70">{PASSOS[step]}</span>
      </div>
      <div className="flex gap-1.5">
        {PASSOS.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brasa' : 'bg-carvao/12'}`}
          />
        ))}
      </div>
    </div>
  )
}

export function QuotePanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)
  const quote = useStore((s) => s.quote)
  const setQuoteField = useStore((s) => s.setQuoteField)
  const resetQuote = useStore((s) => s.resetQuote)
  const toast = useStore((s) => s.toast)

  const [step, setStep] = useState(0)
  const [sent, setSent] = useState(false)
  const [touched, setTouched] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const resumo = useRef(null)
  // Lido so no primeiro render: o rascunho sobrevive a recarga, e reabrir o
  // painel com tudo preenchido, sem dizer nada, parece um formulario de outra
  // pessoa.
  const [veioDeRascunho, setVeioDeRascunho] = useState(() =>
    ['kind', 'qty', 'eventDate', 'colors', 'details', 'name', 'contact'].some((campo) =>
      String(quote[campo] ?? '').trim(),
    ),
  )

  // O minimo e HOJE, e nao hoje + prazo. O aviso ao lado convida a mandar a
  // data apertada ("dependendo da agenda eu consigo encaixar") e o seletor
  // bloqueava justamente essa data: quem tem festa em sete dias — caso comum
  // de topo de bolo — acabava mandando sem data nenhuma.
  const dataMinima = useMemo(() => hojeISO(), [])
  const diasAteEvento = daysUntil(quote.eventDate)
  // Prazo do tipo escolhido, nao um numero unico para tudo: lembrancinha leva
  // 25 dias e caneca leva 10.
  const prazo = useMemo(() => prazoDoTipo(quote.kind), [quote.kind])
  const referencia = diasDeReferencia(prazo)
  // A data pode ter ficado para tras no rascunho salvo de outra visita.
  const passou = diasAteEvento != null && diasAteEvento < 0
  const naFrente = diasAteEvento != null && diasAteEvento >= 0
  const apertado = naFrente && diasAteEvento < referencia
  // Tipo sem familia so tem faixa (10 a 25 dias). Dizer "da tempo tranquilo"
  // com 12 dias seria prometer o piso da faixa como se fosse o teto.
  const incerto = naFrente && !apertado && diasAteEvento < tetoDoPrazo(prazo)
  const tipoNoTexto = prazo.dias != null ? quote.kind.trim() : 'Encomenda personalizada'

  const contato = CONTATOS.find((c) => c.id === quote.contactKind) ?? CONTATOS[0]

  const erros = {
    kind: !quote.kind.trim() ? 'Escolha ou descreva o tipo de peça' : null,
    qty: !quote.qty.toString().trim() ? 'Diga quantas peças, mesmo que seja uma' : null,
    name: !quote.name.trim() ? 'Preciso do seu nome' : null,
    contact: !quote.contact.trim() ? `Informe seu ${contato.label.toLowerCase()}` : null,
  }

  const passoValido = step === 0 ? !erros.kind && !erros.qty : step === 1 ? true : !erros.name && !erros.contact

  // So cobra depois de tentar avancar: marcar tudo de vermelho antes de a
  // pessoa escrever qualquer coisa e agressivo.
  const mostraErro = (campo) => touched && Boolean(erros[campo])

  const avancar = () => {
    setTouched(true)
    if (!passoValido) {
      // Sem isto, o toque em "Continuar" parecia nao fazer nada: no celular a
      // mensagem nascia fora da vista, muitas vezes atras do teclado, e a
      // pessoa achava que o formulario tinha travado.
      const primeiro = (CAMPOS_DO_PASSO[step] ?? []).find((campo) => erros[campo])
      if (primeiro) {
        const campo = document.getElementById(`q-${primeiro}`)
        campo?.focus({ preventScroll: true })
        campo?.scrollIntoView({ block: 'center' })
      }
      return
    }
    setTouched(false)
    if (step < PASSOS.length - 1) setStep(step + 1)
    else setSent(true)
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(quoteText(quote))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
      toast('Pedido copiado')
    } catch {
      // A mensagem antiga mandava "selecionar o texto abaixo", e o texto esta
      // ACIMA dos botoes — mandava olhar para o lugar errado. Em vez de
      // instruir, seleciona: dai basta o copiar do proprio aparelho.
      const alvo = resumo.current
      if (alvo) {
        const faixa = document.createRange()
        faixa.selectNodeContents(alvo)
        const selecao = window.getSelection()
        selecao.removeAllRanges()
        selecao.addRange(faixa)
        alvo.scrollIntoView({ block: 'center' })
      }
      toast('Não consegui copiar sozinho — deixei o texto selecionado')
    }
  }

  if (sent) {
    return (
      <Panel title="Pedido pronto para enviar" onClose={closePanel}>
        <div className="flex items-start gap-3 rounded-xl bg-salvia/18 px-3.5 py-3">
          <IconCheck size={20} className="mt-0.5 shrink-0 text-salvia" />
          <p className="text-[13px] leading-relaxed text-carvao/80">
            Montei o resumo abaixo. Escolha por onde quer mandar — {studio.answerTime.toLowerCase()}.
          </p>
        </div>

        <pre
          ref={resumo}
          className="rolagem-fina mt-4 max-h-56 overflow-auto rounded-xl border border-carvao/10 bg-creme p-3.5 text-[12.5px] leading-relaxed whitespace-pre-wrap text-carvao/80"
        >
          {quoteText(quote)}
        </pre>

        <div className="mt-4 grid gap-2">
          <a href={quoteMessage(quote)} target="_blank" rel="noreferrer" className="btn-principal w-full">
            <IconWhatsapp size={18} />
            Enviar pelo WhatsApp
          </a>
          <div className="grid grid-cols-2 gap-2">
            <a href={quoteMailto(quote)} className="btn-secundario">
              <IconMail size={17} />
              Por e-mail
            </a>
            {/* O retorno fica no proprio botao: um aviso que some em 2,6 s e
                facil de perder justo em quem esta conferindo o resumo. */}
            <button type="button" onClick={copiar} className="btn-secundario">
              {copiado ? <IconCheck size={17} className="text-salvia" /> : <IconCopy size={17} />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-carvao/10 pt-4">
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setStep(0)
            }}
            className="btn-fantasma -ml-1"
          >
            <IconBack size={16} />
            Revisar
          </button>
          <button
            type="button"
            onClick={() => {
              resetQuote()
              setSent(false)
              setStep(0)
              toast('Formulário limpo')
            }}
            className="btn-fantasma text-[13px]"
          >
            Começar outro
          </button>
        </div>
      </Panel>
    )
  }

  return (
    <Panel
      title="Pedir orçamento"
      subtitle={`Sem compromisso. ${studio.answerTime}.`}
      onClose={closePanel}
      footer={
        <div className="mb-3 flex items-center gap-2 md:mb-0">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label="Voltar ao passo anterior"
              className="btn-secundario shrink-0"
            >
              <IconBack size={16} />
            </button>
          )}
          <button type="button" onClick={avancar} className="btn-principal flex-1">
            {step < PASSOS.length - 1 ? 'Continuar' : 'Ver resumo'}
            <IconArrow size={16} />
          </button>
        </div>
      }
    >
      <Progresso step={step} />

      {step === 0 && (
        <div className="grid gap-4">
          {veioDeRascunho && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl bg-carvao/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-carvao/70">
              Continuando o rascunho que você deixou.
              <button
                type="button"
                onClick={() => {
                  resetQuote()
                  setVeioDeRascunho(false)
                  setTouched(false)
                  setStep(0)
                }}
                className="font-semibold text-brasa-texto underline"
              >
                Começar do zero
              </button>
            </p>
          )}
          {/* Os chips e o campo livre respondem pela mesma pergunta: o erro
              pertence ao grupo, nao a um dos dois. */}
          <div
            role="group"
            aria-labelledby="q-kind-titulo"
            aria-describedby={mostraErro('kind') ? 'q-kind-erro' : undefined}
          >
            <span className="etiqueta" id="q-kind-titulo">
              Que tipo de peça?
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setQuoteField('kind', tipo)}
                  aria-pressed={quote.kind === tipo}
                  className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    quote.kind === tipo
                      ? 'border-carvao bg-carvao text-porcelana'
                      : 'border-carvao/15 bg-creme text-carvao/70'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
            <input
              id="q-kind"
              className="campo mt-2"
              placeholder="ou escreva com suas palavras"
              value={quote.kind}
              onChange={(e) => setQuoteField('kind', e.target.value)}
              aria-label="Tipo de peça"
              aria-invalid={mostraErro('kind') || undefined}
              // Tambem no campo, e nao so no grupo: o foco pousa aqui, e
              // descricao de grupo nao e anunciada de forma confiavel nessa
              // hora — o leitor diria "invalido" sem dizer por que.
              aria-describedby={mostraErro('kind') ? 'q-kind-erro' : undefined}
            />
            {mostraErro('kind') && <Erro id="q-kind-erro">{erros.kind}</Erro>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="q-qty">
              Quantas peças?
            </label>
            <input
              id="q-qty"
              className="campo"
              placeholder="ex.: 1 topo e 40 lembrancinhas"
              value={quote.qty}
              onChange={(e) => setQuoteField('qty', e.target.value)}
              aria-invalid={mostraErro('qty') || undefined}
              aria-describedby={mostraErro('qty') ? 'q-qty-erro' : undefined}
            />
            {mostraErro('qty') && <Erro id="q-qty-erro">{erros.qty}</Erro>}
          </div>

          <div>
            <label className="etiqueta" htmlFor="q-details">
              Detalhes <span className="font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              id="q-details"
              className="campo min-h-24 resize-y"
              placeholder="Conte a ideia: o tema da festa, quem são as pessoas, se tem uma foto de referência…"
              value={quote.details}
              onChange={(e) => setQuoteField('details', e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4">
          <div>
            <label className="etiqueta" htmlFor="q-date">
              Data do evento
            </label>
            <input
              id="q-date"
              type="date"
              className="campo"
              min={dataMinima}
              value={quote.eventDate}
              onChange={(e) => setQuoteField('eventDate', e.target.value)}
            />
            {passou && (
              <p className="mt-1.5 rounded-lg bg-brasa/10 px-3 py-2 text-[12px] leading-relaxed text-erro">
                {formatDateBR(quote.eventDate)} já passou. Confere o ano?
              </p>
            )}
            {quote.eventDate && !passou && !apertado && !incerto && (
              <p className="mt-1.5 text-[12px] text-carvao/70">
                {formatDateBR(quote.eventDate)} — {quandoE(diasAteEvento)}, dá tempo tranquilo.
              </p>
            )}
            {incerto && (
              <p className="mt-1.5 text-[12px] leading-relaxed text-carvao/70">
                {tipoNoTexto}: o prazo costuma ser de {prazoEmTexto(prazo)} e {quandoE(diasAteEvento)}.
                Dá para tentar: mande o pedido que eu confirmo na agenda.
              </p>
            )}
            {apertado && (
              <p className="mt-1.5 rounded-lg bg-brasa/10 px-3 py-2 text-[12px] leading-relaxed text-erro">
                {/* "Lembrancinhas costuma levar" nao concorda. A frase passou
                    a nao depender do numero do tipo. */}
                {tipoNoTexto}: o prazo costuma ser de {prazoEmTexto(prazo)} e {quandoE(diasAteEvento)}.
                Fica apertado, mas mande o pedido: dependendo da agenda eu consigo encaixar.
              </p>
            )}
            <p className="mt-1.5 text-[12px] text-carvao/70">Não tem data ainda? Pode deixar em branco.</p>
          </div>

          <div>
            <label className="etiqueta" htmlFor="q-colors">
              Cores ou tema <span className="font-normal normal-case">(opcional)</span>
            </label>
            <input
              id="q-colors"
              className="campo"
              placeholder="ex.: terracota e verde-oliva, tema jardim"
              value={quote.colors}
              onChange={(e) => setQuoteField('colors', e.target.value)}
            />
          </div>

          <p className="rounded-xl bg-carvao/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-carvao/70">
            Tem foto de referência? Manda junto no WhatsApp depois de enviar o resumo — é o que mais
            ajuda a acertar a peça de primeira.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <div>
            <label className="etiqueta" htmlFor="q-name">
              Seu nome
            </label>
            <input
              id="q-name"
              className="campo"
              autoComplete="name"
              value={quote.name}
              onChange={(e) => setQuoteField('name', e.target.value)}
              aria-invalid={mostraErro('name') || undefined}
              aria-describedby={mostraErro('name') ? 'q-name-erro' : undefined}
            />
            {mostraErro('name') && <Erro id="q-name-erro">{erros.name}</Erro>}
          </div>

          <div>
            <span className="etiqueta">Onde prefere conversar?</span>
            <div className="mb-2 flex gap-1.5">
              {CONTATOS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setQuoteField('contactKind', c.id)}
                  aria-pressed={quote.contactKind === c.id}
                  className={`flex-1 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                    quote.contactKind === c.id
                      ? 'border-carvao bg-carvao text-porcelana'
                      : 'border-carvao/15 bg-creme text-carvao/70'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <input
              id="q-contact"
              className="campo"
              type={contato.type}
              autoComplete={contato.autoComplete}
              inputMode={contato.id === 'whatsapp' ? 'tel' : undefined}
              placeholder={contato.placeholder}
              value={quote.contact}
              onChange={(e) => setQuoteField('contact', e.target.value)}
              aria-label={contato.label}
              aria-invalid={mostraErro('contact') || undefined}
              aria-describedby={mostraErro('contact') ? 'q-contact-erro' : undefined}
            />
            {mostraErro('contact') && <Erro id="q-contact-erro">{erros.contact}</Erro>}
          </div>

          <p className="text-[12px] leading-relaxed text-carvao/70">
            Seus dados vão só para o ateliê responder o orçamento. Nada de lista de e-mail.{' '}
            <button type="button" onClick={() => openPanel('processo')} className="underline">
              Ver como funciona a encomenda
            </button>
          </p>
        </div>
      )}
    </Panel>
  )
}
