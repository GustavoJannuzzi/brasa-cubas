import { Environment, Lightformer } from '@react-three/drei'
import { room } from '../data/scene'

/**
 * Luz de fim de tarde entrando pela janela.
 * @param {{quality: 'alta'|'baixa'}} props
 */
export function Lighting({ quality = 'alta' }) {
  const alta = quality === 'alta'
  const win = room.window

  return (
    <>
      <ambientLight intensity={0.5} color="#fff2df" />
      <hemisphereLight args={['#fff4e4', '#6b4a34', 0.45]} />

      {/* sol da janela: a unica luz que projeta sombra, para nao pesar */}
      <directionalLight
        position={[win.x + 1.6, win.y + 1.5, room.wallZ + 2.4]}
        intensity={1.45}
        color="#ffd9a8"
        castShadow={alta}
        shadow-mapSize={alta ? [1024, 1024] : [512, 512]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-2.6, 2.6, 2.8, -0.4, 0.5, 9]} />
      </directionalLight>

      {/* clareia a frente das pecas, que ficariam contra a luz */}
      <directionalLight position={[-0.8, 1.6, 3]} intensity={0.32} color="#ffe6cc" />
      {/* devolve um pouco de luz do chao, como um rebatedor */}
      <directionalLight position={[0.4, -1, 1.2]} intensity={0.12} color="#c98b5e" />

      {/* Ambiente gerado na hora, sem baixar HDRI: e o que da o brilho
          suave de porcelana nas pecas. */}
      <Environment resolution={alta ? 128 : 64} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff3e0" scale={[3, 2, 1]} position={[2.5, 2, -1]} target={[0, 1, 0]} />
        <Lightformer form="rect" intensity={0.7} color="#ffe0bd" scale={[4, 2, 1]} position={[0, 1.2, 4]} target={[0, 1, 0]} />
        <Lightformer form="ring" intensity={0.5} color="#8fa089" scale={2} position={[-3, 1.5, 1]} target={[0, 1, 0]} />
      </Environment>
    </>
  )
}
