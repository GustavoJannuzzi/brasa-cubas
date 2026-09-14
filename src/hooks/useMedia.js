import { useEffect, useState } from 'react'

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setMatches(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])

  return matches
}

// Mesmo ponto de quebra do Tailwind (md): abaixo disso a UI vira
// bottom sheet e a camera se afasta.
export const useIsMobile = () => useMediaQuery('(max-width: 767px)')

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')

export const useIsTouch = () => useMediaQuery('(hover: none) and (pointer: coarse)')
