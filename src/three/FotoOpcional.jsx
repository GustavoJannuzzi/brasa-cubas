import { Component } from 'react'

/**
 * Limite de erro das fotos da cena (mural e quadros).
 *
 * A foto e enfeite do ateliê, nao a cena. Sem este limite, uma unica textura que
 * nao carregasse — nome trocado ao substituir uma foto, rede do celular caindo no
 * meio — subia ate o Boundary3D, que troca o 3D INTEIRO pelo aviso "O 3D parou de
 * desenhar". Medido bloqueando so `retrato-01.jpg`: canvas removido, `gl3d`
 * "perdido". Aqui o erro para: some so o grupo que dependia da foto, e a cena
 * segue.
 */
export class FotoOpcional extends Component {
  state = { falhou: false }

  static getDerivedStateFromError() {
    return { falhou: true }
  }

  componentDidCatch(erro) {
    console.warn('Uma foto da cena nao carregou; a cena segue sem ela.', erro)
  }

  render() {
    return this.state.falhou ? null : this.props.children
  }
}
