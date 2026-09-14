import { studio } from '../../data/studio'
import { plainHello } from '../../lib/whatsapp'
import { useStore } from '../../store/useStore'
import { IconArrow, IconClock, IconInstagram, IconMail, IconTruck, IconWhatsapp } from '../Icons'
import { Panel } from '../Panel'

function Canal({ icon: Icon, label, value, href, destaque }) {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag
      {...(href ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' } : {})}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
        destaque ? 'bg-brasa text-porcelana' : 'cartao text-carvao hover:bg-carvao/4'
      }`}
    >
      <Icon size={20} className={destaque ? 'text-porcelana/80' : 'text-carvao/45'} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-semibold tracking-wide uppercase ${destaque ? 'text-porcelana/70' : 'text-carvao/50'}`}>
          {label}
        </span>
        <span className="block truncate text-[14px] font-medium">{value}</span>
      </span>
      {href && <IconArrow size={16} className={destaque ? 'text-porcelana/70' : 'text-carvao/30'} />}
    </Tag>
  )
}

export function ContactPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)

  return (
    <Panel
      title="Falar com o ateliê"
      subtitle={`${studio.city} · ${studio.answerTime}`}
      onClose={closePanel}
      footer={
        <button type="button" onClick={() => openPanel('orcamento')} className="btn-secundario mb-3 w-full md:mb-0">
          Preferir escrever um orçamento agora
        </button>
      }
    >
      <p className="mb-4 text-[14px] leading-relaxed text-carvao/80">
        Quem responde aqui é a Isabela, a mesma pessoa que modela as peças. Pode mandar foto,
        pergunta solta ou só uma ideia mal formada — é assim que a maioria das encomendas começa.
      </p>

      <div className="grid gap-2">
        <Canal
          destaque
          icon={IconWhatsapp}
          label="WhatsApp"
          value={studio.whatsappLabel}
          href={plainHello()}
        />
        <Canal icon={IconMail} label="E-mail" value={studio.email} href={`mailto:${studio.email}`} />
        <Canal icon={IconInstagram} label="Instagram" value={studio.instagram} href={studio.instagramUrl} />
        <Canal icon={IconClock} label="Horário" value={studio.hours} />
        <Canal icon={IconTruck} label="Entrega" value={studio.shipping} />
      </div>

      <p className="mt-4 rounded-xl bg-carvao/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-carvao/65">
        O ateliê é um espaço de trabalho, não uma loja de rua — visita só com hora marcada. Para
        retirada em Porto Alegre, combinamos o ponto pelo WhatsApp.
      </p>
    </Panel>
  )
}
