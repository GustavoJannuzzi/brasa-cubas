import { Lightformer } from '@react-three/drei'
import { room } from '../data/scene'
import { AmbienteGerado } from './AmbienteGerado'
import { useGeracaoDoContexto } from './useGeracaoDoContexto'

/**
 * Luz de fim de tarde entrando pela janela.
 *
 * A posicao do sol nao e decorativa. A janela virou um vao de verdade na
 * parede do fundo (ver Atelier.jsx), entao o facho tem por onde entrar: a
 * direcao foi escolhida para o raio que passa pelo centro do vao bater na
 * bancada, em (0.5, 0.78, 0). A cruz clara que aparece no tampo e a sombra
 * das travessas do caixilho, projetada de verdade — nao ha mancha de luz
 * pintada em lugar nenhum da cena.
 *
 * Consequencia: fora do facho o comodo depende todo da luz indireta. Por isso
 * o ambiente e a hemisferica sao mais fortes aqui do que costumam ser, e
 * existem dois rebatedores sem sombra — um pela frente aberta, um do piso.
 *
 * @param {{quality: 'alta'|'baixa'}} props
 */
export function Lighting({ quality = 'alta' }) {
  const alta = quality === 'alta'
  const win = room.window
  const geracao = useGeracaoDoContexto()

  return (
    <>
      <ambientLight intensity={0.46} color="#fff1dc" />
      <hemisphereLight args={['#ffeeda', '#7a5336', 0.55]} />

      {/* o sol: a unica luz que projeta sombra, para nao pesar */}
      <directionalLight
        position={[2.35, 2.63, -4.76]}
        intensity={2.4}
        color="#ffd2a0"
        castShadow={alta}
        shadow-mapSize={alta ? [2048, 2048] : [512, 512]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.022}
        // No PCF do three 0.186 o raio e em texels do mapa: e o que desfoca a
        // borda da cruz do caixilho na bancada, como a luz de janela faz.
        shadow-radius={alta ? 3 : 1}
      >
        {/* O frustum tem de cobrir o comodo inteiro: o que fica fora dele
            nao e sombreado, e apareceria como um retalho claro na parede. */}
        {/* Topo em 4.0, e nao 3.8: com o pe-direito em 3,05 a quina frontal da
            parede esquerda sai do frustum, e o three devolve "iluminado" para o
            que esta fora — sairia uma tira clara na sanca daquela ponta. O
            preco e o texel indo de 3,71 mm para 3,90 mm em 2048. */}
        <orthographicCamera attach="shadow-camera" args={[-4.2, 4.2, 4.0, -3.8, 0.5, 13]} />
      </directionalLight>

      {/* rebatedor da frente aberta: clareia a face das pecas, que ficariam
          todas contra a luz */}
      <directionalLight position={[-0.9, 1.9, 4.2]} intensity={0.34} color="#ffe4c8" />
      {/* rebatedor do piso, como um pano claro no chao */}
      <directionalLight position={[0.4, -1.4, 1.2]} intensity={0.16} color="#c98b5e" />
      {/* o vao da janela devolve luz para aquele canto */}
      <pointLight
        position={[win.x, win.y - 0.1, room.wallZ + 0.35]}
        intensity={0.5}
        distance={2.2}
        decay={2}
        color="#ffe0b4"
      />

      {/* Ambiente gerado na hora, sem baixar HDRI: e o que da o brilho suave
          de porcelana nas pecas e o reflexo lustroso nas folhas. Desenhado uma
          vez: a `key` refaz depois de o contexto cair (useGeracaoDoContexto). */}
      <AmbienteGerado key={geracao} resolution={alta ? 128 : 64}>
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#fff3e0"
          scale={[2.2, 3, 1]}
          position={[2.6, 1.9, -2.2]}
          target={[0, 1.2, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          color="#ffe0bd"
          scale={[4, 2.2, 1]}
          position={[0, 1.3, 4]}
          target={[0, 1.2, 0]}
        />
        <Lightformer
          form="ring"
          intensity={0.45}
          color="#8fa089"
          scale={2.2}
          position={[-3, 1.4, 0.6]}
          target={[0, 1.2, 0]}
        />
      </AmbienteGerado>
    </>
  )
}
