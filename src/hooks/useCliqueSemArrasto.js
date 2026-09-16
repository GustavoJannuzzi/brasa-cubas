import { useCallback, useRef } from 'react'

// Quanto o ponteiro pode andar e o gesto ainda valer como clique. Seis pixels
// cobrem o tremor da mao e do dedo sem deixar passar um arrasto de verdade.
const TOLERANCIA = 6

/**
 * Handlers para botao que fica POR CIMA da cena 3D.
 *
 * Arrastar para olhar em volta quase sempre comeca com o dedo em cima de algum
 * desses botoes, e o navegador dispara o clique assim que a pessoa solta — o
 * painel abria sozinho no meio da exploracao, que e o conceito do site. Os
 * alvos dentro da cena resolvem isso com o `delta` do R3F; em DOM esse numero
 * nao existe, entao a distancia e medida aqui.
 *
 * Clique de teclado nao passa por pointerdown e segue valendo.
 */
export function useCliqueSemArrasto(aoClicar) {
  const inicio = useRef(null)

  const onPointerDown = useCallback((e) => {
    inicio.current = { x: e.clientX, y: e.clientY }
  }, [])

  const onClick = useCallback(
    (e) => {
      const de = inicio.current
      inicio.current = null
      if (de && Math.hypot(e.clientX - de.x, e.clientY - de.y) > TOLERANCIA) return
      aoClicar(e)
    },
    [aoClicar],
  )

  return { onPointerDown, onClick }
}
