import { useEffect, useRef } from 'react'
import { lugarCurtoDaFoto, lugarDaFoto, passeioDeFotos, vizinhasDaFoto } from '../data/scene'
import { useStore } from '../store/useStore'
import { IconArrow, IconClose } from './Icons'
import { vidro } from './vidro'

// Passeio entre as fotos da Isabela.
//
// Sao 8 molduras e 3 fotos distintas: o que a seta percorre e LUGAR, nao
// imagem — por isso o contador fala "3 de 8" e o rotulo diz onde aquela esta.
// A ordem e as vizinhas vivem em data/scene.js, junto das posicoes: quem mover
// uma moldura move o passeio junto, sem editar dois lugares.
//
// Duas regras de gesto:
// - SETA, e nao deslizar no canvas: arrastar continua girando a camera, que e a
//   navegacao que o dono escolheu manter. Roubar o arrasto aqui criaria dois
//   significados para o mesmo gesto, dependendo do estado.
// - As setas de cima e de baixo so aparecem onde existem de verdade (a coluna
//   da parede do fundo). Botao morto e pior que botao ausente.

const rotulo = (id) => {
  const n = passeioDeFotos.indexOf(id) + 1
  return `Foto ${n} de ${passeioDeFotos.length}, ${lugarDaFoto[id] ?? 'no ateliê'}`
}

// No celular sobra pouca largura ao lado das setas: medido, a frase inteira
// truncava em "Foto 8 de 8, na...". A forma curta cabe, e quem usa leitor de
// tela continua ouvindo a frase inteira.
const curto = (id) => `${passeioDeFotos.indexOf(id) + 1}/${passeioDeFotos.length} · ${lugarCurtoDaFoto[id] ?? ''}`

export function FotoNav() {
  const quadroFocado = useStore((s) => s.quadroFocado)
  const panel = useStore((s) => s.panel)
  const focarQuadro = useStore((s) => s.focarQuadro)
  const clearFocus = useStore((s) => s.clearFocus)
  const caixa = useRef(null)

  const visivel = Boolean(quadroFocado && !panel)
  const vizinhas = quadroFocado ? vizinhasDaFoto(quadroFocado) : null

  // Teclado: as setas andam pelas fotos, com a mesma logica dos botoes. Esc ja
  // fecha o close pelo CameraRig. So quando o foco NAO esta num campo de texto,
  // senao a seta dentro de um input do orcamento viraria troca de foto.
  useEffect(() => {
    if (!visivel || !vizinhas) return
    const onKey = (e) => {
      const alvo = e.target
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)) return
      const destino = {
        ArrowLeft: vizinhas.esquerda,
        ArrowRight: vizinhas.direita,
        ArrowUp: vizinhas.cima,
        ArrowDown: vizinhas.baixo,
      }[e.key]
      if (!destino) return
      e.preventDefault()
      focarQuadro(destino)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visivel, vizinhas, focarQuadro])

  if (!visivel || !vizinhas) return null

  const Seta = ({ para, giro, titulo }) =>
    para ? (
      <button
        type="button"
        onClick={() => focarQuadro(para)}
        title={titulo}
        aria-label={`${titulo}: ${rotulo(para)}`}
        className="grid h-11 w-11 place-items-center rounded-full text-carvao/70 transition-colors hover:bg-carvao/6 hover:text-carvao"
      >
        <span className={giro} aria-hidden="true">
          <IconArrow size={17} />
        </span>
      </button>
    ) : (
      // Espaco reservado: sem ele a linha dos botoes dança quando uma seta some.
      <span className="h-11 w-11" aria-hidden="true" />
    )

  return (
    <div className="anim-sobe camada-cena fixed right-3 bottom-[calc(var(--barra-altura,5.7rem)_+_var(--sobra-area-segura))] left-3 z-20 md:right-auto md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:left-1/2 md:w-[22rem] md:-translate-x-1/2">
      <div
        ref={caixa}
        role="region"
        aria-label="Fotos da Isabela"
        className="relative flex items-center gap-1 rounded-2xl bg-porcelana/95 py-2 pr-2 pl-3 shadow-[var(--shadow-painel)]"
        style={vidro(6)}
      >
        <div className="min-w-0 flex-1">
          {/* `key` no texto que troca: com a pagina traduzida pelo navegador, o
              rotulo ficava no lugar velho. Ver src/lib/tradutor.js. */}
          <p key={quadroFocado} aria-hidden="true" className="truncate text-[12.5px] text-carvao">
            <span className="md:hidden">{curto(quadroFocado)}</span>
            <span className="hidden md:inline">{rotulo(quadroFocado)}</span>
          </p>
          {/* A frase inteira, so para leitor de tela: e ela que diz onde a
              camera acabou de parar. */}
          <span key={`aria-${quadroFocado}`} role="status" aria-live="polite" className="sr-only">
            {rotulo(quadroFocado)}
          </span>
        </div>

        <Seta para={vizinhas.cima} giro="block -rotate-90" titulo="Foto de cima" />
        <Seta para={vizinhas.baixo} giro="block rotate-90" titulo="Foto de baixo" />
        <Seta para={vizinhas.esquerda} giro="block rotate-180" titulo="Foto anterior" />
        <Seta para={vizinhas.direita} giro="block" titulo="Próxima foto" />

        <button
          type="button"
          onClick={clearFocus}
          aria-label="Sair da foto"
          className="ml-1 grid h-11 w-11 place-items-center rounded-full text-carvao/55 transition-colors hover:bg-carvao/6 hover:text-carvao"
        >
          <IconClose size={15} />
        </button>
      </div>
    </div>
  )
}
