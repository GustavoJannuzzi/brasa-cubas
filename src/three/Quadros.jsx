import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { room } from '../data/scene'
import { roundedBox } from './shapes'

// Primeiras imagens de verdade da cena: ate aqui tudo era geometria e textura
// desenhada em canvas. Sao fotos de referencia de peca (quadrinhos na parede) e
// fotos da familia da Isabela (porta-retratos), servidas de /public/fotos.
//
// Ficam num modulo proprio, e nao dentro de Atelier, porque carregam de forma
// assincrona: quem chama envolve isto num <Suspense> curto, para o comodo
// aparecer inteiro enquanto as fotos ainda estao vindo.

const FRENTE_PAREDE = 0.012 // 12 mm a frente da face interna, para a moldura ter ar

/**
 * Quadros de parede.
 *
 * Distribuidos em dois grupos, e isso e resultado de olhar, nao de calculo: na
 * primeira tentativa os cinco foram para a parede do fundo a esquerda, e os
 * dois de baixo brigaram com a luminaria (que, da camera `home`, cai bem na
 * frente deles) e com a borda do mural. Parede apertada le pior que parede
 * vazia. A esquerda cabem tres; os outros dois foram para o retorno da direita,
 * que e a parede realmente vazia da sala — e assim recompensam quem gira para
 * aquele lado, onde antes so havia parede lisa.
 */
const QUADROS = [
  // Coluna entre a placa e a estante, na parede do fundo.
  { foto: '/fotos/peca-01.jpg', pos: [-1.18, 1.74, room.wallZ + FRENTE_PAREDE], gira: 0, w: 0.23, inclina: 0.012 },
  { foto: '/fotos/peca-03.jpg', pos: [-1.18, 1.41, room.wallZ + FRENTE_PAREDE], gira: 0, w: 0.23, inclina: -0.01 },
  { foto: '/fotos/peca-05.jpg', pos: [-1.18, 1.08, room.wallZ + FRENTE_PAREDE], gira: 0, w: 0.23, inclina: 0.008 },
  // Retorno da direita, em DIPTICO: mesmo tamanho, mesma altura, 32 cm de
  // centro a centro. Passei por duas tentativas piores ate aqui — a 1 m eles
  // liam como dois objetos solitarios, e a meio metro com tamanhos e alturas
  // diferentes ainda liam como par mal arrumado. Numa parede grande e vazia o
  // que funciona e o conjunto alinhado; espacamento de quadro se mede na tela,
  // nao no chao.
  //
  // Os dois ficam ATRAS de z -1.05: a hera do retorno nasce em z -0.8 e a
  // folhagem dela chega perto disso. Passar por cima seria trocar parede vazia
  // por quadro escondido atras de folha.
  { foto: '/fotos/peca-02.jpg', pos: [room.halfW - FRENTE_PAREDE, 1.46, -1.5], gira: -Math.PI / 2, w: 0.21, inclina: -0.008 },
  { foto: '/fotos/peca-04.jpg', pos: [room.halfW - FRENTE_PAREDE, 1.46, -1.18], gira: -Math.PI / 2, w: 0.21, inclina: 0.008 },
]

/** Fotos da Isabela em porta-retrato, apoiadas em superficie. */
const RETRATOS = [
  // No peitoril da janela: o ponto livre mais visto da vista `home`.
  { foto: '/fotos/retrato-04.jpg', pos: [1.31, 1.17, room.wallZ + 0.1], gira: -0.34, w: 0.15, prop: 0.8 },
  // Na ponta livre da tabua de baixo, do lado oposto a jiboia da tabua de cima.
  { foto: '/fotos/retrato-01.jpg', pos: [-0.86, 0.9825, -1.5], gira: 0.42, w: 0.14, prop: 1 },
  // Na bancada, entre o caderno e o potinho.
  { foto: '/fotos/retrato-03.jpg', pos: [0.63, 0.78, 0.31], gira: -0.22, w: 0.115, prop: 1 },
]

export const FOTOS = [...QUADROS.map((q) => q.foto), ...RETRATOS.map((r) => r.foto)]

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

/** Moldura de parede: caixa de madeira, passe-partout claro e a foto. */
function QuadroDeParede({ mapa, pos, gira, largura, inclina }) {
  const altura = largura / 0.8 // as fotos de peca sao 4:5
  const margem = 0.018
  return (
    <group position={pos} rotation={[0, gira, inclina]}>
      <mesh geometry={roundedBox(largura, altura, 0.016, 0.004)} castShadow receiveShadow>
        <meshStandardMaterial color="#7a5537" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0, 0.009]}>
        <planeGeometry args={[largura - margem, altura - margem]} />
        <meshStandardMaterial color="#f7f1e6" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.0095]}>
        <planeGeometry args={[largura - margem * 2.6, (altura - margem * 2.6) * 0.98]} />
        <meshStandardMaterial map={mapa} roughness={0.78} />
      </mesh>
    </group>
  )
}

/** Porta-retrato de mesa: moldura em pe, inclinada, com o pe atras. */
function PortaRetrato({ mapa, pos, gira, largura, prop }) {
  const altura = largura / prop
  const margem = 0.014
  const INCLINACAO = 0.16 // ~9 graus para tras, como um porta-retrato de verdade
  return (
    <group position={pos} rotation={[0, gira, 0]}>
      <group position={[0, altura / 2, 0]} rotation={[-INCLINACAO, 0, 0]}>
        <mesh geometry={roundedBox(largura, altura, 0.012, 0.003)} castShadow receiveShadow>
          <meshStandardMaterial color="#8a6647" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.0068]}>
          <planeGeometry args={[largura - margem, altura - margem]} />
          <meshStandardMaterial color="#f7f1e6" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.0072]}>
          <planeGeometry args={[largura - margem * 2.2, altura - margem * 2.2]} />
          <meshStandardMaterial map={mapa} roughness={0.76} />
        </mesh>
        {/* pe: a aba que segura a moldura em pe, inclinada ao contrario */}
        <mesh
          geometry={roundedBox(largura * 0.34, altura * 0.62, 0.008, 0.003)}
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
  return (
    <group>
      {QUADROS.map((q, i) => (
        <QuadroDeParede key={q.foto} mapa={mapas[i]} pos={q.pos} gira={q.gira} largura={q.w} inclina={q.inclina} />
      ))}
      {RETRATOS.map((r, i) => (
        <PortaRetrato
          key={r.foto}
          mapa={mapas[QUADROS.length + i]}
          pos={r.pos}
          gira={r.gira}
          largura={r.w}
          prop={r.prop}
        />
      ))}
    </group>
  )
}

useTexture.preload(FOTOS)
