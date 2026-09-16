import { gallery } from '../../data/products'
import { useStore } from '../../store/useStore'
import { IconArrow } from '../Icons'
import { Panel } from '../Panel'

export function GalleryPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const openPanel = useStore((s) => s.openPanel)

  return (
    <Panel
      title="Projetos entregues"
      subtitle="O que já saiu desta bancada"
      onClose={closePanel}
      footer={
        <button type="button" onClick={() => openPanel('orcamento')} className="btn-principal mb-3 w-full md:mb-0">
          Quero algo parecido
          <IconArrow size={16} />
        </button>
      }
    >
      <ul className="grid gap-3">
        {gallery.map((item) => (
          <li key={item.id} className="cartao overflow-hidden">
            {/* Lugar da foto. Trocar por <img> quando as imagens existirem. */}
            <div
              className="grid h-32 place-items-center"
              style={{
                background: `linear-gradient(135deg, ${item.palette[0]} 0%, ${item.palette[1]} 100%)`,
              }}
            >
              <span className="rounded-full bg-carvao/20 px-2.5 py-1 text-[10.5px] font-medium tracking-wide text-porcelana uppercase">
                foto em breve
              </span>
            </div>
            <div className="p-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[15px] leading-snug">{item.title}</h3>
                <span className="shrink-0 text-[12px] text-carvao/55">{item.year}</span>
              </div>
              <p className="mt-0.5 text-[12px] font-medium text-brasa-texto">{item.kind}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-carvao/70">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
