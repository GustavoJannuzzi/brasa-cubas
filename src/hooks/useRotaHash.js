import { useEffect } from 'react'
import { estadoDoHash, hashDoEstado } from '../lib/rotas'
import { useStore } from '../store/useStore'

/**
 * Liga o painel aberto ao endereco da pagina.
 *
 * Resolve duas coisas que o site nao fazia: o voltar do navegador saia do site
 * em vez de fechar o painel (no celular e o gesto padrao para fechar qualquer
 * coisa), e nao havia link para mandar alguem direto ao orcamento ou a uma
 * peca — o que a Isabela precisa para a bio e para os stories.
 *
 * Regra do historico: abrir um painel com nada aberto EMPILHA (o voltar
 * fecha); trocar de painel SUBSTITUI (o voltar nao percorre tudo o que a
 * pessoa espiou); fechar desfaz a entrada que empilhamos. Um link que ja chega
 * com hash tambem substitui, senao o voltar ficaria preso no painel em vez de
 * sair do site.
 */
export function useRotaHash() {
  useEffect(() => {
    // Se a entrada atual do historico foi empilhada por nos — so entao fechar
    // pode chamar history.back() sem jogar a pessoa para fora do site.
    let empurrado = false
    // Marca o popstate que nos mesmos provocamos ao fechar.
    let voltando = false

    const aplicar = (painel, produto) => {
      const s = useStore.getState()
      // Voltar do navegador (no Android, o gesto de fechar qualquer coisa) e
      // fechar o cartao: leva junto a camera de volta a visao geral, igual ao X.
      if (!painel) s.dispensarPainel()
      else if (painel === 'produto') s.openProduct(produto, { focus: false })
      else s.openPanel(painel)
    }

    const inicial = estadoDoHash(window.location.hash)
    if (inicial.painel) {
      aplicar(inicial.painel, inicial.produto)
      // Quem chegou pelo link do orcamento nao quer um tutorial de tres telas
      // por cima dele. Vale so nesta visita: nao persiste.
      useStore.getState().pularOnboarding()
      window.history.replaceState(
        { painel: inicial.painel },
        '',
        hashDoEstado(inicial.painel, inicial.produto),
      )
    }

    // Assinatura do store, e nao um efeito com [panel] nas dependencias: o
    // efeito enxerga o valor do render, que na dupla montagem do StrictMode
    // chega velho — e o ramo de "fechou" apagava o hash que o bloco acima
    // tinha acabado de escrever. A assinatura entrega o anterior de verdade.
    // O endereco segue o painel PEDIDO, e nao o que ja subiu: entre o toque e a
    // chegada da camera o cartao fica pendurado em `painelPendente` (ver o
    // store). Sem isto, trocar de painel passava por um instante com os dois
    // nulos, e este assinante lia isso como "fechou" — disparava history.back()
    // e o push do painel novo corria contra ele.
    const painelDe = (s) => s.panel || s.painelPendente
    const parar = useStore.subscribe((s, ant) => {
      const painel = painelDe(s)
      const antes = painelDe(ant)
      if (painel === antes && s.selectedProduct === ant.selectedProduct) return

      const alvo = hashDoEstado(painel, s.selectedProduct)
      // Mudanca que veio do proprio historico: o endereco ja esta certo.
      if (alvo === window.location.hash) return

      if (alvo) {
        if (antes) {
          window.history.replaceState({ painel }, '', alvo)
        } else {
          window.history.pushState({ painel }, '', alvo)
          empurrado = true
        }
        return
      }

      if (empurrado) {
        empurrado = false
        voltando = true
        window.history.back()
        return
      }
      // Painel que veio de um link direto: nao ha entrada nossa para desfazer,
      // entao so limpa o hash, preservando o resto do endereco.
      window.history.replaceState({}, '', window.location.pathname + window.location.search)
    })

    const aoVoltar = () => {
      if (voltando) {
        voltando = false
        return
      }
      const { painel, produto } = estadoDoHash(window.location.hash)
      empurrado = Boolean(painel)
      aplicar(painel, produto)
    }
    window.addEventListener('popstate', aoVoltar)

    return () => {
      parar()
      window.removeEventListener('popstate', aoVoltar)
    }
  }, [])
}
