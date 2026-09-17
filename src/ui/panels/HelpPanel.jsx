import { hotspots } from '../../data/scene'
import { useIsMobile, useIsTouch } from '../../hooks/useMedia'
import { useStore } from '../../store/useStore'
import { IconCube, IconEye, IconEyeOff, IconHome, IconLayers, IconSparkle, MarcadorEmLinha } from '../Icons'
import { Panel } from '../Panel'

function Acao({ icon: Icon, title, text, onClick, ativo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
        ativo ? 'bg-carvao text-porcelana' : 'cartao text-carvao hover:bg-carvao/4'
      }`}
    >
      <Icon size={19} className={`mt-0.5 shrink-0 ${ativo ? 'text-porcelana/75' : 'text-carvao/55'}`} />
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">{title}</span>
        <span className={`mt-0.5 block text-[12.5px] leading-snug ${ativo ? 'text-porcelana/65' : 'text-carvao/70'}`}>
          {text}
        </span>
      </span>
    </button>
  )
}

export function HelpPanel() {
  const closePanel = useStore((s) => s.closePanel)
  const goTo = useStore((s) => s.goTo)
  const showHotspots = useStore((s) => s.showHotspots)
  const toggleHotspots = useStore((s) => s.toggleHotspots)
  const toggleSimpleMode = useStore((s) => s.toggleSimpleMode)
  const startTour = useStore((s) => s.startTour)
  const replayOnboarding = useStore((s) => s.replayOnboarding)
  const discovered = useStore((s) => s.discovered)
  // Pelo link #ajuda o painel abre tambem no modo lista. Tour, visao geral,
  // marcadores e apresentacao so existem no 3D (fechavam o painel e nada mais), e
  // "Ver como lista" faria o contrario do que diz.
  const simpleMode = useStore((s) => s.simpleMode)
  const isTouch = useIsTouch()
  // A POSICAO do menu vem da largura (md), nao do toque: no iPad em pe o menu
  // esta no topo, e numa janela estreita com mouse, embaixo. Pelo toque, a frase
  // mandava procurar no lugar errado nos dois casos (medido).
  const isMobile = useIsMobile()

  return (
    <Panel title="Como navegar" subtitle="O ateliê é 3D, mas nada aqui depende de saber girar a cena" onClose={closePanel}>
      <ul className="grid gap-2.5 text-[13.5px] leading-relaxed text-carvao/75">
        <li className="flex gap-2.5">
          <span className="font-display text-brasa-texto">1</span>
          <span>
            {isTouch ? 'Arraste com um dedo' : 'Arraste com o mouse'} para girar o ateliê.{' '}
            {isTouch ? 'Pinça' : 'Rolar a roda'} para aproximar e afastar.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="font-display text-brasa-texto">2</span>
          <span>
            {isTouch ? 'Toque' : 'Clique'} nos marcadores <MarcadorEmLinha /> para
            abrir cada parte do ateliê. {isTouch ? 'Tocar' : 'Clicar'} direto no objeto também funciona.
          </span>
        </li>
        <li className="flex gap-2.5">
          <span className="font-display text-brasa-texto">3</span>
          <span>
            Com pressa? O menu {isMobile ? 'de baixo' : 'do topo'} leva direto a produtos, orçamento e
            contato, sem precisar explorar.
          </span>
        </li>
      </ul>

      <p className="mt-4 rounded-xl bg-salvia/15 px-3.5 py-2.5 text-[12.5px] font-medium text-carvao/75">
        Você já encontrou {discovered.length} de {hotspots.length} pontos do ateliê.
      </p>

      <div className="mt-5 grid gap-2">
        {simpleMode ? (
          <Acao
            icon={IconCube}
            title="Ver o ateliê em 3D"
            text="A mesma vitrine, dentro do ateliê."
            onClick={toggleSimpleMode}
          />
        ) : (
          <>
            <Acao
              icon={IconSparkle}
              title="Fazer o tour guiado"
              text="Passo a passo pelos cinco pontos, na ordem."
              onClick={() => {
                startTour()
                closePanel()
              }}
            />
            <Acao
              icon={IconHome}
              title="Voltar para a visão geral"
              text="Reenquadra a cena no ponto de partida."
              onClick={() => {
                goTo('home')
                closePanel()
              }}
            />
            <Acao
              icon={showHotspots ? IconEyeOff : IconEye}
              title={showHotspots ? 'Esconder os marcadores' : 'Mostrar os marcadores'}
              text="Para olhar o ateliê sem nada por cima."
              onClick={toggleHotspots}
            />
            <Acao
              icon={IconLayers}
              title="Ver como lista, sem 3D"
              text="Mesmo conteúdo em página comum. Bom para conexão fraca ou aparelho antigo."
              onClick={toggleSimpleMode}
            />
            <Acao
              icon={IconCube}
              title="Rever a apresentação"
              text="Aquelas três telas do começo."
              onClick={() => {
                replayOnboarding()
                closePanel()
              }}
            />
          </>
        )}
      </div>
    </Panel>
  )
}
