import { Suspense, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { gallery } from '../data/products'
import { room } from '../data/scene'
import { useStore } from '../store/useStore'
import { roundedBox } from './shapes'
import { corkTexture } from './textures'

// Mural de cortica na parede da esquerda, com as fotos dos projetos.
//
// Ate aqui as "fotos" eram retangulos de cor, e era a parte mais frágil da
// cena: seis blocos chapados de laranja, cinza e rosa. Agora sao as imagens de
// verdade, do mesmo `gallery` que alimenta o painel de Projetos — foto e
// legenda saem sempre da mesma fonte, entao nao ha como discordarem.

const FOTOS = gallery.map((g) => g.foto)

/** Posicao de cada foto no quadro, com a fileira de baixo centralizada. */
const disposicao = () => {
  const porFileira = 3
  const fileiras = Math.ceil(gallery.length / porFileira)
  return gallery.map((item, i) => {
    const fileira = Math.floor(i / porFileira)
    const nesta = Math.min(porFileira, gallery.length - fileira * porFileira)
    const col = i % porFileira
    // centraliza cada fileira pela quantidade que ela tem: com cinco fotos a
    // de baixo fica com duas, e sem isto elas ficariam encostadas a esquerda
    const largura = (nesta - 1) * 0.36
    return {
      ...item,
      x: -largura / 2 + col * 0.36,
      y: (fileiras - 1) * 0.16 - fileira * 0.32,
      tilt: (i % 2 === 0 ? 1 : -1) * (2 + (i % 3)) * (Math.PI / 180),
    }
  })
}

/** As fotos em si. Carregam de forma assincrona, por isso vivem num Suspense. */
function FotosDoMural({ itens, aoAbrir }) {
  const mapas = useTexture(FOTOS)
  const texturas = useMemo(() => {
    const lista = Array.isArray(mapas) ? mapas : [mapas]
    for (const t of lista) {
      // Sem SRGBColorSpace a foto entra como se fosse linear e sai lavada
      // depois do tonemapping ACES da cena.
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 8
      t.needsUpdate = true
    }
    return lista
  }, [mapas])

  return (
    <>
      {itens.map((item, i) => (
        <group
          key={item.id}
          position={[item.x, item.y, 0.021]}
          rotation={[0, 0, item.tilt]}
          onClick={(e) => {
            // Arrasto que comeca em cima de uma foto e giro de camera, nao
            // clique na foto.
            if (e.delta > 6) return
            e.stopPropagation()
            aoAbrir()
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          {/* papel com espessura: a foto projeta sombrinha na cortica */}
          <mesh geometry={roundedBox(0.24, 0.3, 0.004, 0.003)} castShadow>
            <meshStandardMaterial color="#fbf8f2" roughness={0.82} />
          </mesh>
          {/* a imagem, deixando uma tarja de papel embaixo, como polaroide */}
          <mesh position={[0, 0.012, 0.003]}>
            <planeGeometry args={[0.2, 0.25]} />
            <meshStandardMaterial map={texturas[i]} roughness={0.7} />
          </mesh>
          {/* alfinete */}
          <mesh position={[0, 0.13, 0.012]} castShadow>
            <sphereGeometry args={[0.009, 12, 8]} />
            <meshStandardMaterial color="#c2582d" roughness={0.28} metalness={0.2} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export function Pinboard() {
  const cork = useMemo(() => corkTexture(), [])
  const openPanel = useStore((s) => s.openPanel)
  const itens = useMemo(disposicao, [])

  return (
    <group position={[-room.halfW + 0.03, 1.5, -0.9]} rotation={[0, Math.PI / 2, 0]}>
      {/* moldura: caixa de canto arredondado, com a cortica recuada dentro */}
      <mesh geometry={roundedBox(1.24, 0.84, 0.032, 0.012)} castShadow receiveShadow>
        <meshStandardMaterial color="#8a6647" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.018]} receiveShadow>
        <planeGeometry args={[1.16, 0.76]} />
        <meshStandardMaterial map={cork} bumpMap={cork} bumpScale={0.4} roughness={0.88} />
      </mesh>

      {/* Suspense CURTO: a cortica e a moldura aparecem na hora, e as fotos
          entram quando chegam. Sem isto o mural inteiro sumiria enquanto
          carrega, e ele fica bem no caminho da camera de abertura. */}
      <Suspense fallback={null}>
        <FotosDoMural itens={itens} aoAbrir={() => openPanel('galeria')} />
      </Suspense>

      {/* fita de papel com a palavra do ateliê, so para dar vida ao mural */}
      <mesh position={[0.45, -0.28, 0.021]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[0.2, 0.07]} />
        <meshStandardMaterial color="#e8dccb" roughness={0.82} />
      </mesh>
    </group>
  )
}
