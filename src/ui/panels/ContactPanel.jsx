import { studio } from '../../data/studio'
import { plainHello } from '../../lib/whatsapp'
import { useStore } from '../../store/useStore'
import { IconArrow, IconClock, IconInstagram, IconMail, IconTruck, IconWhatsapp } from '../Icons'
import { Panel } from '../Panel'

function Canal({ icon: Icon, label, value, href, destaque }) {
  const Tag = href ? 'a' : 'div'
  // `min-w-0` vai na LINHA, e nao so no bloco de texto que ja o tinha: a linha
  // e item de uma grade de coluna unica, e a largura da coluna e ditada pelo
  // minimo automatico do item mais largo. Com `min-width: auto`, o valor em
  // `truncate` (que traz `white-space: nowrap`, cujo minimo e o texto inteiro)
  // fazia a coluna valer 459 px dentro de uma folha de 375 no celular: as cinco
  // linhas saiam 116 px pela direita, cortando telefone, e-mail e o @ do
  // Instagram. Precisa valer para TODAS as linhas — consertar uma so nao muda
  // nada, porque as outras continuam forcando a coluna. Medido antes e depois.
  //
  // O destaque usa o fundo do botao principal (brasa-texto), e nao a brasa: o
  // #c2582d ficou para marcador, icone e barra. Com ele, o numero dava 3,96:1 e
  // o rotulo "WhatsApp" a 70%, 2,72:1. Agora 4,53:1 nos dois — por isso o rotulo
  // vai cheio: a 70% ainda seriam 3,03.
  return (
    <Tag
      {...(href ? { href, target: href.startsWith('http') ? '_blank' : undefined, rel: 'noreferrer' } : {})}
      className={`flex min-w-0 items-center gap-3 rounded-xl px-3.5 py-3 transition-colors ${
        destaque ? 'bg-brasa-texto text-porcelana' : 'cartao text-carvao hover:bg-carvao/4'
      }`}
    >
      <Icon size={20} className={destaque ? 'text-porcelana/80' : 'text-carvao/55'} />
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-semibold tracking-wide uppercase ${destaque ? 'text-porcelana' : 'text-carvao/70'}`}>
          {label}
        </span>
        {/* Quebra em vez de reticencias: a linha de envio cortava "Entrega em maos
            em Foz do Iguacu" em todo celular (281 de 407 px em 375), e em 300 px
            ate o e-mail perdia o fim. `wrap-anywhere` deixa o minimo da coluna
            pequeno, entao o `min-w-0` acima segue valendo. */}
        <span className="block text-[14px] font-medium wrap-anywhere">{value}</span>
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

      <p className="mt-4 rounded-xl bg-carvao/5 px-3.5 py-3 text-[12.5px] leading-relaxed text-carvao/70">
        O ateliê é um espaço de trabalho, não uma loja de rua — visita só com hora marcada. Para
        retirada em Foz do Iguaçu, combinamos o ponto pelo WhatsApp.
      </p>
    </Panel>
  )
}
