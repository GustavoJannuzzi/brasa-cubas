import { Component } from 'react'
import { useStore } from '../store/useStore'

/**
 * Limite de erro dos paineis.
 *
 * Sem ele, qualquer erro ao desenhar um painel derrubava o site INTEIRO: nao ha
 * outro limite acima, e o React desmonta a raiz. Medido injetando um rascunho
 * invalido no store e abrindo o Orcamento: a pagina ficou com zero nos, e nem
 * outro painel abria mais — so recarregando. Aqui o erro para no painel: ele
 * fecha, um aviso explica, e o ateliê, o menu e o pedido seguem.
 *
 * Quem usa passa `key` com o painel aberto, para a proxima abertura comecar de
 * um limite limpo.
 */
export class PainelSeguro extends Component {
  state = { falhou: false }

  static getDerivedStateFromError() {
    return { falhou: true }
  }

  componentDidCatch(erro) {
    console.warn('Um painel falhou ao abrir; o resto do site segue.', erro)
    const s = useStore.getState()
    s.closePanel()
    s.toast('Não deu para abrir isso agora. Se repetir, recarregue a página.')
  }

  render() {
    return this.state.falhou ? null : this.props.children
  }
}
