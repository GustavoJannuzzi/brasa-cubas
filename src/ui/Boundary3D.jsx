import { Component } from 'react'

/**
 * Limite de erro em volta do 3D, e SO do 3D: se a cena quebrar, o menu, os
 * paineis e o catalogo continuam de pe. Sem isto, uma excecao dentro do Canvas
 * derruba a arvore inteira e a pagina fica em branco.
 */
export class Boundary3D extends Component {
  state = { quebrou: false }

  static getDerivedStateFromError() {
    return { quebrou: true }
  }

  componentDidCatch(erro) {
    this.props.onErro?.(erro)
  }

  render() {
    return this.state.quebrou ? null : this.props.children
  }
}
