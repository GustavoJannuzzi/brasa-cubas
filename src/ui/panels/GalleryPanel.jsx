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
            {/* A foto no lugar do degrade de espera. `loading="lazy"` porque a
                lista abre com cinco e nem todas aparecem de cara. */}
            <img
              src={item.foto}
              alt={item.title}
              loading="lazy"
              className="h-56 w-full object-cover"
              style={{ background: item.palette[1] }}
            />
            <div className="p-3.5">
              <h3 className="text-[15px] leading-snug">{item.title}</h3>
              <p className="mt-0.5 text-[12px] font-medium text-brasa-texto">{item.kind}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-carvao/70">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
