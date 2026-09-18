import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { plants } from '../data/scene'
import { useReducedMotion } from '../hooks/useMedia'
import { buildPlant, disposePlant } from './plantGeometry'

// Acabamento por grupo de material. A cor nao esta aqui: vem em vertex color
// da propria geometria, o que deixa uma folha escurecer da ponta para a base
// e as quinze plantas da cena dividirem cinco materiais.
const ACABAMENTO = {
  leaf: { roughness: 0.44, side: THREE.DoubleSide, envMapIntensity: 0.9 },
  stem: { roughness: 0.6, envMapIntensity: 0.5 },
  pot: { roughness: 0.82, envMapIntensity: 0.4 },
  soil: { roughness: 0.96, side: THREE.DoubleSide, envMapIntensity: 0.25 },
  cord: { roughness: 0.9, envMapIntensity: 0.4 },
}

// Uniforms do vento, compartilhados por todas as plantas: um relogio e uma
// forca. Sao objetos mutaveis de proposito — mexer no `.value` nao recompila
// shader, ao contrario de trocar a amplitude por uma constante no codigo.
const tempoVento = { value: 0 }
// Exportado de proposito, e so por isso: e o unico jeito de uma sonda conferir
// a promessa de `prefers-reduced-motion` aqui. O uniforme NAO aparece em
// `material.uniforms` nem em `material.userData` — `aplicarVento` o injeta
// dentro do `onBeforeCompile`, entao ele vive no shader compilado. Como a
// atribuicao la embaixo e `shader.uniforms.uForca = forcaVento`, o shader
// recebe esta MESMA referencia: ler `forcaVento.value` daqui e ler o que ele
// esta usando agora.
export const forcaVento = { value: 0.022 }

/**
 * Vento no vertex shader. O deslocamento e proporcional a `aVento` (distancia
 * do vertice ate o vaso), entao o caule fica firme e a ponta da folha e que
 * anda. Duas ondas fora de fase em x e z para nao parecer metronomo.
 */
const aplicarVento = (material, grupo) => {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = tempoVento
    shader.uniforms.uForca = forcaVento
    shader.vertexShader = `
      uniform float uTempo;
      uniform float uForca;
      attribute float aVento;
      ${shader.vertexShader}
    `.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float balanco = uForca * aVento;
       transformed.x += sin(uTempo * 1.15 + transformed.z * 2.6 + transformed.y * 1.4) * balanco;
       transformed.z += cos(uTempo * 0.87 + transformed.x * 3.1) * balanco * 0.55;`,
    )
  }
  // Sem isto o three reaproveita o programa compilado do material padrao e o
  // vento nao chega no shader. A chave leva o grupo para folha (dupla face) e
  // haste (face simples) nao dividirem o mesmo programa.
  material.customProgramCacheKey = () => `planta-vento-${grupo}`
}

// Os materiais vivem enquanto a pagina vive: sao cinco, iguais para todas as
// plantas, e recria-los a cada montagem do canvas custaria recompilar shader.
let cacheMateriais = null
const materiaisPlanta = () => {
  if (cacheMateriais) return cacheMateriais
  cacheMateriais = {}
  for (const [grupo, cfg] of Object.entries(ACABAMENTO)) {
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      vertexColors: true,
      metalness: 0,
      ...cfg,
    })
    if (grupo === 'leaf' || grupo === 'stem') aplicarVento(material, grupo)
    cacheMateriais[grupo] = material
  }
  return cacheMateriais
}

function Planta({ kind, position, rotation, scale, seed, hanging, bracket, stand, frente, alta }) {
  const built = useMemo(
    () => buildPlant(kind, { alta, seed, hanging, bracket, stand, frente }),
    [kind, alta, seed, hanging, bracket, stand, frente],
  )
  useEffect(() => () => disposePlant(built), [built])
  const materiais = materiaisPlanta()

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
    >
      {Object.entries(built).map(([grupo, geometry]) => (
        <mesh
          key={grupo}
          geometry={geometry}
          material={materiais[grupo]}
          castShadow={alta}
          receiveShadow
        />
      ))}
    </group>
  )
}

/**
 * Todas as plantas da cena.
 * @param {{quality: 'alta'|'baixa'}} props em qualidade baixa cai a contagem
 * de folhas e a subdivisao de cada uma, nao a quantidade de plantas: o que
 * pesa e o triangulo, e planta faltando muda a composicao.
 */
export function Plants({ quality = 'alta' }) {
  const reduzida = useReducedMotion()
  const alta = quality === 'alta'

  useEffect(() => {
    forcaVento.value = reduzida ? 0 : 0.022
  }, [reduzida])

  useFrame((_, delta) => {
    tempoVento.value += delta
  })

  return (
    <group>
      {plants.map((planta) => (
        <Planta key={planta.id} {...planta} alta={alta} />
      ))}
    </group>
  )
}
