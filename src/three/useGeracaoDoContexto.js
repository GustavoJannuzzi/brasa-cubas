import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Quantas vezes o contexto WebGL voltou depois de cair. Serve de `key` para o
 * que e desenhado UMA vez numa textura da GPU (`frames={1}`): o mapa de
 * ambiente e a sombra de contato do piso.
 *
 * O navegador in-app derruba o contexto ao voltar do WhatsApp — a saida
 * principal do site. O three recria as texturas vazias, e ninguem as desenhava
 * de novo: a cena voltava sem a luz indireta, com o mesmo brilho medio de uma
 * cena sem mapa de ambiente (medido: 113,7 contra 124,1 no 375; 116,7 contra
 * 131,4 em 1440), e o piso sem a sombra das pecas. Remontar desenha de novo.
 */
export function useGeracaoDoContexto() {
  const gl = useThree((s) => s.gl)
  const [geracao, setGeracao] = useState(0)

  useEffect(() => {
    const tela = gl.domElement
    const voltou = () => setGeracao((g) => g + 1)
    tela.addEventListener('webglcontextrestored', voltou)
    return () => tela.removeEventListener('webglcontextrestored', voltou)
  }, [gl])

  return geracao
}
