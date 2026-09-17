import { useLayoutEffect, useMemo, useEffect, useRef, useState } from 'react'
import { createPortal, useThree } from '@react-three/fiber'
import { HalfFloatType, Scene, WebGLCubeRenderTarget } from 'three'

/**
 * Mapa de ambiente desenhado uma vez a partir dos filhos (Lightformers).
 *
 * E o mesmo caminho do `<Environment frames={1}>` do drei 10 quando ele recebe
 * so filhos: cena virtual, cubeCamera com alvo em meio-float, uma renderizacao
 * e `scene.environment` apontando para o resultado. Existe porque o
 * `Environment` do drei importa tambem os carregadores de HDR/EXR/gainmap
 * (~45 KB no pacote do 3D) mesmo quando nenhum arquivo e baixado. A imagem
 * sai igual pixel a pixel (conferido por diferenca de captura antes/depois).
 *
 * Nao tem `background`, `blur` nem `frames` maior que 1: a cena nao usa.
 *
 * @param {{resolution?: number, near?: number, far?: number, children: React.ReactNode}} props
 */
export function AmbienteGerado({ resolution = 256, near = 0.1, far = 1000, children }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useRef(null)
  const [virtual] = useState(() => new Scene())
  const alvo = useMemo(() => {
    const fbo = new WebGLCubeRenderTarget(resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])

  useEffect(() => () => alvo.dispose(), [alvo])

  // Os filhos entram nas dependencias como no drei: se mudarem, redesenha.
  useLayoutEffect(() => {
    const autoClear = gl.autoClear
    gl.autoClear = true
    camera.current.update(gl, virtual)
    gl.autoClear = autoClear
    const antes = scene.environment
    scene.environment = alvo.texture
    return () => {
      scene.environment = antes
    }
  }, [children, virtual, alvo, scene, gl])

  return createPortal(
    <>
      {children}
      <cubeCamera ref={camera} args={[near, far, alvo]} />
    </>,
    virtual,
  )
}
