import { Component } from 'react'
import { studio } from '../data/studio'
import { plainHello } from '../lib/whatsapp'

/**
 * Ultimo limite de erro, na raiz.
 *
 * O 3D, as fotos e os paineis ja tem os seus. Um erro em qualquer outra parte
 * (cabecalho, camadas sobre a cena, apresentacao, lista) desmontava a raiz e a
 * pagina ficava vazia, sem nada para fazer. Medido injetando `cart: null` no
 * store: o seletor do cabecalho quebra e a raiz vai a zero nos.
 *
 * O substituto nao le o store — ele pode ser a causa. Oferece recarregar, limpar
 * o que esta guardado (se o problema vier dali, recarregar sozinho nao resolve)
 * e falar direto com o ateliê, para o pedido nunca ficar sem saida.
 */
export class ErroGeral extends Component {
  state = { falhou: false }

  static getDerivedStateFromError() {
    return { falhou: true }
  }

  componentDidCatch(erro) {
    console.error('O site parou de desenhar.', erro)
  }

  render() {
    if (!this.state.falhou) return this.props.children

    const recomecar = () => {
      try {
        localStorage.removeItem('brasa-cubas')
      } catch {
        /* sem storage, recarregar ja e o recomeco */
      }
      window.location.reload()
    }

    return (
      <main className="fixed inset-0 overflow-auto bg-porcelana px-6 py-12 text-carvao">
        <div className="mx-auto grid max-w-md gap-4">
          <h1 className="font-display text-[26px] leading-tight">Algo deu errado por aqui</h1>
          <p className="text-[15px] leading-relaxed text-carvao/80">
            A página parou de funcionar. Recarregar costuma resolver. Se o problema voltar, dá para
            recomeçar do zero — isso apaga o pedido e o rascunho guardados neste aparelho.
          </p>
          <div className="grid gap-2">
            <button type="button" onClick={() => window.location.reload()} className="btn-principal">
              Recarregar a página
            </button>
            <button type="button" onClick={recomecar} className="btn-secundario">
              Limpar o que está guardado e recarregar
            </button>
          </div>
          <p className="text-[14px] leading-relaxed text-carvao/80">
            Ou fale direto com o ateliê:{' '}
            <a href={plainHello()} target="_blank" rel="noreferrer" className="font-semibold text-brasa-texto underline">
              WhatsApp {studio.whatsappLabel}
            </a>
          </p>
        </div>
      </main>
    )
  }
}
