import { useMemo, useRef, useState } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { quadros, retratos } from '../data/scene'
import { useReducedMotion } from '../hooks/useMedia'
import { useStore } from '../store/useStore'
import { roundedBox } from './shapes'

// Quadros da parede e porta-retratos, com as fotos da Isabela.
//
// As POSICOES vivem em data/scene.js, nao aqui: o CameraRig precisa delas para
// enquadrar quem clica num quadro, e duas copias da mesma lista seria a receita
// para eu editar uma e nao entender por que nada muda.
//
// Carregam de forma assincrona, entao quem monta este componente envolve tudo
// num <Suspense> curto — a cena inteira nao pode suspender junto.

export const FOTOS = [...quadros.map((q) => q.foto), ...retratos.map((r) => r.foto)]

// Respiro do brilho: sem icone, sem texto, sem seta. O pedido foi "algum tipo
// de interacao que comunique que da para chegar perto, mas sem escrever".
const BRILHO_MIN = 0.03
const BRILHO_MAX = 0.17
const BRILHO_TOQUE = 0.38
// Com movimento reduzido nada pulsa: fica um realce parado, do mesmo jeito que
// o pulso do marcador vira anel e a poeira do facho para de flutuar.
const BRILHO_PARADO = 0.12

/**
 * Prepara a textura para foto colorida.
 * `colorSpace` nao e detalhe: sem SRGBColorSpace a imagem entra como se fosse
 * linear, e depois do tonemapping ACES da cena a foto sai lavada e escura.
 */
function usarFotos(urls) {
  const mapas = useTexture(urls)
  return useMemo(() => {
    const lista = Array.isArray(mapas) ? mapas : [mapas]
    for (const t of lista) {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    }
    return lista
  }, [mapas])
}

/** O brilho da moldura, que e o unico aviso de que da para clicar. */
function usarBrilho(reduzida) {
  const material = useRef(null)
  const [perto, setPerto] = useState(false)

  useFrame((state) => {
    const m = material.current
    if (!m) return
    if (reduzida) {
      m.emissiveIntensity = perto ? BRILHO_TOQUE : BRILHO_PARADO
      return
    }
    const onda = (Math.sin(state.clock.elapsedTime * 1.1) + 1) / 2
    const base = BRILHO_MIN + onda * (BRILHO_MAX - BRILHO_MIN)
    m.emissiveIntensity = perto ? BRILHO_TOQUE : base
  })

  const sobre = (valor) => {
    setPerto(valor)
    document.body.style.cursor = valor ? 'pointer' : ''
  }
  return { material, sobre }
}

/** Moldura de parede: caixa de madeira, passe-partout claro e a foto. */
function QuadroDeParede({ mapa, item, aoClicar, reduzida }) {
  const { material, sobre } = usarBrilho(reduzida)
  const altura = item.w / item.prop // a proporcao vem da foto, nao fixa em 4:5
  const margem = 0.018
  // A foto encaixa na area interna RESPEITANDO a proporcao dela. Subtrair uma
  // margem fixa das duas dimensoes muda a proporcao da area, e a imagem saia
  // desencaixada — sobrava passe-partout de um lado so.
  const caixaL = item.w - margem * 2.6
  const caixaA = altura - margem * 2.6
  const fotoL = Math.min(caixaL, caixaA * item.prop)
  const fotoA = fotoL / item.prop

  return (
    <group
      position={item.pos}
      rotation={[0, item.gira, item.inclina]}
      onClick={(e) => {
        // Arrasto que comeca em cima do quadro e giro de camera, nao clique.
        if (e.delta > 6) return
        e.stopPropagation()
        aoClicar()
      }}
      onPointerOver={() => sobre(true)}
      onPointerOut={() => sobre(false)}
    >
      <mesh geometry={roundedBox(item.w, altura, 0.016, 0.004)} castShadow receiveShadow>
        <meshStandardMaterial ref={material} color="#7a5537" emissive="#ffb887" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[item.w - margem, altura - margem]} />
        <meshStandardMaterial color="#f7f1e6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.0095]}>
        <planeGeometry args={[fotoL, fotoA]} />
        <meshStandardMaterial map={mapa} roughness={0.78} />
      </mesh>
    </group>
  )
}

/** Porta-retrato de mesa: moldura em pe, inclinada, com o pe atras. */
function PortaRetrato({ mapa, item, aoClicar, reduzida }) {
  const { material, sobre } = usarBrilho(reduzida)
  const altura = item.w / item.prop
  const margem = 0.014
  // Mesmo encaixe do quadro de parede: proporcao da foto preservada dentro da
  // area interna, para nao sobrar passe-partout de um lado.
  const caixaL = item.w - margem * 2.2
  const caixaA = altura - margem * 2.2
  const fotoL = Math.min(caixaL, caixaA * item.prop)
  const fotoA = fotoL / item.prop
  const INCLINACAO = 0.16 // ~9 graus para tras, como um porta-retrato de verdade

  return (
    <group
      position={item.pos}
      rotation={[0, item.gira, 0]}
      onClick={(e) => {
        if (e.delta > 6) return
        e.stopPropagation()
        aoClicar()
      }}
      onPointerOver={() => sobre(true)}
      onPointerOut={() => sobre(false)}
    >
      <group position={[0, altura / 2, 0]} rotation={[-INCLINACAO, 0, 0]}>
        <mesh geometry={roundedBox(item.w, altura, 0.012, 0.003)} castShadow receiveShadow>
          <meshStandardMaterial ref={material} color="#8a6647" emissive="#ffb887" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.0068]}>
          <planeGeometry args={[item.w - margem, altura - margem]} />
          <meshStandardMaterial color="#f7f1e6" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.0072]}>
          <planeGeometry args={[fotoL, fotoA]} />
          <meshStandardMaterial map={mapa} roughness={0.76} />
        </mesh>
        {/* pe: a aba que segura a moldura em pe, inclinada ao contrario */}
        <mesh
          geometry={roundedBox(item.w * 0.34, altura * 0.62, 0.008, 0.003)}
          position={[0, -altura * 0.14, -0.024]}
          rotation={[0.34, 0, 0]}
          castShadow
        >
          <meshStandardMaterial color="#6f4a37" roughness={0.7} />
        </mesh>
      </group>
    </group>
  )
}

export function Quadros() {
  const mapas = usarFotos(FOTOS)
  const reduzida = useReducedMotion()
  const focarQuadro = useStore((s) => s.focarQuadro)

  return (
    <group>
      {quadros.map((item, i) => (
        <QuadroDeParede
          key={item.id}
          item={item}
          mapa={mapas[i]}
          reduzida={reduzida}
          aoClicar={() => focarQuadro(item.id)}
        />
      ))}
      {retratos.map((item, i) => (
        <PortaRetrato
          key={item.id}
          item={item}
          mapa={mapas[quadros.length + i]}
          reduzida={reduzida}
          aoClicar={() => focarQuadro(item.id)}
        />
      ))}
    </group>
  )
}

useTexture.preload(FOTOS)
