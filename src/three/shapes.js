import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

// Quina viva e o que fazia a cena parecer maquete de papelao: madeira de
// verdade tem canto lixado, e um canto lixado de 6 mm ja pega um brilho
// especular que a caixa reta nao pega. Toda madeira, moldura e caixote da
// cena passa por aqui.
//
// A geometria e cacheada por medida porque a cena repete muito a mesma peca
// (tres tabuas iguais de prateleira, quatro pernas iguais de mesa): sem o
// cache seriam quatro geometrias identicas na memoria da GPU.

const cache = new Map()

/**
 * Caixa de canto arredondado.
 * @param {number} w largura
 * @param {number} h altura
 * @param {number} d profundidade
 * @param {number} r raio do canto — limitado a metade da menor aresta, que e
 *   o maximo que a RoundedBoxGeometry aceita sem virar do avesso
 * @param {number} seg segmentos do arredondamento; 2 basta para ler como
 *   canto lixado, 3 ou 4 so em peca grande e perto da camera
 */
export const roundedBox = (w, h, d, r = 0.01, seg = 2) => {
  const raio = Math.min(r, Math.min(w, h, d) / 2 - 0.0005)
  const key = `${w}|${h}|${d}|${raio}|${seg}`
  let geo = cache.get(key)
  if (!geo) {
    geo = new RoundedBoxGeometry(w, h, d, seg, raio)
    cache.set(key, geo)
  }
  return geo
}

/**
 * Cilindro de topo abaulado, para pe de movel e cabo torneado.
 * Perfil de revolucao em vez de cilindro reto: o cilindro reto termina numa
 * aresta de 90 graus que aparece feio contra o chao claro.
 */
export const roundedCylinder = (raio, altura, arredonda = 0.012, segments = 16) => {
  const key = `cil|${raio}|${altura}|${arredonda}|${segments}`
  let geo = cache.get(key)
  if (!geo) {
    const a = Math.min(arredonda, raio * 0.9, altura / 2)
    geo = new THREE.LatheGeometry(
      [
        [0.0001, 0],
        [raio - a, 0],
        [raio, a],
        [raio, altura - a],
        [raio - a, altura],
        [0.0001, altura],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      segments,
    )
    cache.set(key, geo)
  }
  return geo
}
