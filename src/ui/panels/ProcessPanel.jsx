import { useState } from 'react'
import { faq, howToOrder, studio } from '../../data/studio'
import { useStore } from '../../store/useStore'
import { IconArrow, IconPlus, IconMinus } from '../Icons'
import { Panel } from '../Panel'

function Pergunta({ item, aberta, onToggle }) {
  return (
    <li className="border-b border-carvao/10 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberta}
        className="flex w-full items-start gap-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1 text-[13.5px] leading-snug font-medium text-carvao">{item.q}</span>
        <span className="mt-0.5 shrink-0 text-carvao/40">
          {aberta ? <IconMinus size={16} /> : <IconPlus size={16} />}
        </span>
      </button>
      {aberta && <p className="pb-3.5 text-[13px] leading-relaxed text-carvao/70">{item.a}</p>}
    </li>
  )
}

export function ProcessPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)
  const [aberta, setAberta] = useState(0)

  return (
    <Panel
      title="Como encomendar"
      subtitle="Do primeiro contato até a peça na sua mão"
      onClose={closePanel}
      footer={
        <button type="button" onClick={() => openPanel('orcamento')} className="btn-principal mb-3 w-full md:mb-0">
          Começar meu orçamento
          <IconArrow size={16} />
        </button>
      }
    >
      <p className="text-[14px] leading-relaxed text-carvao/80">
        O ateliê trabalha com <strong className="font-semibold text-carvao">porcelana fria</strong>:
        massa artesanal que seca ao ar, leve e cheia de detalhe. Cada peça é modelada e pintada à
        mão, uma a uma — não existe molde industrial no meio do caminho.
      </p>

      <ol className="mt-5 grid gap-3">
        {howToOrder.map((item) => (
          <li key={item.step} className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brasa/12 font-display text-[15px] font-semibold text-brasa">
              {item.step}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className="block text-[14px] font-medium text-carvao">{item.title}</span>
              <span className="mt-0.5 block text-[13px] leading-relaxed text-carvao/68">{item.text}</span>
            </span>
          </li>
        ))}
      </ol>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        {[
          ['Prazo mínimo', `${studio.minLeadDays} dias`],
          ['Resposta', studio.answerTime.replace('Resposta em ', '')],
          ['Envio', 'Todo o Brasil'],
          ['Pagamento', '50% + 50%'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-carvao/5 px-3 py-2.5">
            <dt className="text-[11px] font-semibold tracking-wide text-carvao/50 uppercase">{label}</dt>
            <dd className="mt-0.5 text-[13.5px] font-medium text-carvao">{value}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 mb-1 text-[16px]">Dúvidas frequentes</h3>
      <ul className="cartao px-3.5">
        {faq.map((item, i) => (
          <Pergunta key={item.q} item={item} aberta={aberta === i} onToggle={() => setAberta(aberta === i ? -1 : i)} />
        ))}
      </ul>
    </Panel>
  )
}
