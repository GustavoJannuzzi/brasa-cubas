import { Html } from '@react-three/drei'
import { hotspots } from '../data/scene'
import { useCliqueSemArrasto } from '../hooks/useCliqueSemArrasto'
import { useStore } from '../store/useStore'
import { hotspotIcons } from '../ui/Icons'

function Hotspot({ spot }) {
  const openPanel = useStore((s) => s.openPanel)
  const discovered = useStore((s) => s.discovered.includes(spot.id))
  const active = useStore((s) => s.panel === spot.panel)
  const isTourTarget = useStore((s) => s.tourStep >= 0 && hotspots[s.tourStep]?.id === spot.id)
  const view = useStore((s) => s.view)
  const Icon = hotspotIcons[spot.icon]
  const semArrasto = useCliqueSemArrasto((e) => {
    e.stopPropagation()
    openPanel(spot.panel)
  })

  // Um marcador nao convida para onde a pessoa ja esta. Na vista da
  // prateleira, o rotulo "Produtos · 11 pecas com preco" ficava por cima da
  // etiqueta de preco de uma peca — medido em 116 x 22 px a 900 de altura e
  // 116 x 37 px a 720. O painel continua a um toque no menu, na peca e na
  // etiqueta. Durante o tour o marcador fica, porque ali ele e o assunto.
  if (view === spot.view && !isTourTarget) return null

  return (
    <group position={spot.position}>
      {/* Clicar no objeto tambem funciona, nao so no marcador:
          e o gesto que a pessoa tenta primeiro. */}
      <mesh
        onClick={(e) => {
          if (e.delta > 6) return
          e.stopPropagation()
          openPanel(spot.panel)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
        visible={false}
      >
        <sphereGeometry args={[0.13, 8, 6]} />
      </mesh>

      {/* Marcador em coluna: ponto em cima, rotulo embaixo. Rotulo ao lado
          estourava a borda da tela em retrato, e para o lado errado. */}
      {/* Fora do caminho do teclado de proposito: o marcador e DOM solto sobre
          a cena e continua focavel mesmo quando esta atras da camera ou fora
          da tela. O menu e o catalogo levam aos mesmos destinos e sao o
          caminho de teclado. */}
      <Html center zIndexRange={[16, 0]} style={{ pointerEvents: 'auto' }} aria-hidden="true">
        <button
          type="button"
          tabIndex={-1}
          {...semArrasto}
          aria-label={`${spot.label}: ${spot.hint}`}
          className="flex flex-col items-center gap-1"
        >
          <span
            className={`relative grid h-9 w-9 place-items-center rounded-full border transition-colors ${
              active
                ? 'border-brasa bg-brasa text-porcelana'
                : 'border-carvao/10 bg-creme/92 text-brasa'
            }`}
            style={{ backdropFilter: 'blur(4px)' }}
          >
            {(!discovered || isTourTarget) && (
              <span className="anim-pulso absolute inset-0 rounded-full bg-brasa-clara/70" />
            )}
            {Icon ? <Icon size={17} /> : null}
          </span>

          <span
            className={`rounded-lg border px-2 py-0.5 text-center leading-tight whitespace-nowrap transition-colors ${
              active ? 'border-brasa bg-brasa text-porcelana' : 'border-carvao/10 bg-creme/92 text-carvao'
            }`}
            style={{ backdropFilter: 'blur(4px)' }}
          >
            <span className="block text-[12px] font-medium">{spot.label}</span>
            <span
              className={`hidden text-[10.5px] sm:block ${active ? 'text-porcelana/80' : 'text-carvao/70'}`}
            >
              {spot.hint}
            </span>
          </span>
        </button>
      </Html>
    </group>
  )
}

export function Hotspots() {
  const showHotspots = useStore((s) => s.showHotspots)
  // Quando o contexto WebGL cai, o canvas para de desenhar mas estes rotulos
  // sao DOM (drei Html): continuariam pendurados sobre o vazio preto, e
  // clicaveis, mandando a camera para um lugar que ninguem ve. Somem com a cena.
  const gl3d = useStore((s) => s.gl3d)
  if (!showHotspots || gl3d !== 'ok') return null
  return (
    <>
      {hotspots.map((spot) => (
        <Hotspot key={spot.id} spot={spot} />
      ))}
    </>
  )
}
