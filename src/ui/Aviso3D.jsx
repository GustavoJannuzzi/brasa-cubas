import { useStore } from '../store/useStore'
import { IconLayers } from './Icons'

/**
 * Faixa para quando o 3D nao esta desenhando: ou o aparelho nao abre WebGL, ou
 * o contexto caiu (tipico do WKWebView ao voltar do WhatsApp), ou a cena
 * lancou excecao. Fica em DOM, fora do Canvas, justamente para aparecer quando
 * o Canvas nao aparece.
 */
export function Aviso3D({ onTentarDeNovo }) {
  const gl3d = useStore((s) => s.gl3d)
  const setSimpleMode = useStore((s) => s.setSimpleMode)

  if (gl3d === 'ok') return null

  const indisponivel = gl3d === 'indisponivel'

  return (
    <div
      role="status"
      className="camada-cena anim-sobe fixed top-[3.4rem] left-1/2 z-[48] w-[min(28rem,calc(100vw-1.5rem))] -translate-x-1/2 md:top-[4.4rem]"
    >
      <div className="cartao flex items-start gap-3 p-4">
        <IconLayers size={19} className="mt-0.5 shrink-0 text-brasa" />
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-medium text-carvao">
            {indisponivel ? 'Este navegador não abre o ateliê em 3D' : 'O ateliê 3D parou de desenhar'}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-carvao/70">
            O catálogo, os preços e o orçamento continuam aqui — em lista, que abre leve.
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSimpleMode(true)}
              className="btn-principal px-3.5 py-2 text-[12.5px]"
            >
              Ver em lista
            </button>
            {!indisponivel && (
              <button type="button" onClick={onTentarDeNovo} className="btn-secundario px-3.5 py-2 text-[12.5px]">
                Tentar de novo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
