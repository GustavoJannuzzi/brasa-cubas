import * as THREE from 'three'

// Texturas desenhadas em canvas, na hora. Nenhum arquivo de imagem no projeto:
// menos peso para baixar e nada para carregar antes da cena aparecer.

const canvas = (size = 512) => {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return [c, c.getContext('2d')]
}

const noise = (ctx, size, amount, alpha) => {
  const img = ctx.getImageData(0, 0, size, size)
  const data = img.data
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * amount
    data[i] = Math.min(255, Math.max(0, data[i] + n))
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n))
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n))
    if (alpha != null) data[i + 3] = alpha
  }
  ctx.putImageData(img, 0, 0)
}

const finish = (c, repeat = [1, 1], aniso = 4) => {
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(repeat[0], repeat[1])
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = aniso
  return tex
}

let cache = {}

/** Assoalho de tabua corrida. */
export const woodFloorTexture = () => {
  if (cache.floor) return cache.floor
  const size = 512
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#6b4a34'
  ctx.fillRect(0, 0, size, size)

  const plankH = size / 8
  for (let row = 0; row < 8; row++) {
    const tone = 0.82 + Math.random() * 0.36
    const r = Math.round(107 * tone)
    const g = Math.round(74 * tone)
    const b = Math.round(52 * tone)
    ctx.fillStyle = `rgb(${r},${g},${b})`
    ctx.fillRect(0, row * plankH, size, plankH - 2)

    // veios
    ctx.strokeStyle = `rgba(40,25,16,0.18)`
    ctx.lineWidth = 1
    for (let k = 0; k < 9; k++) {
      const y = row * plankH + 4 + Math.random() * (plankH - 10)
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x <= size; x += 32) {
        ctx.lineTo(x, y + Math.sin(x * 0.05 + k) * 1.6)
      }
      ctx.stroke()
    }
    // fresta entre tabuas
    ctx.fillStyle = 'rgba(28,18,12,0.55)'
    ctx.fillRect(0, row * plankH + plankH - 2, size, 2)
  }
  noise(ctx, size, 16)
  cache.floor = finish(c, [5, 5], 8)
  return cache.floor
}

/** Tampo da mesa: tabua mais clara e mais lisa. */
export const tableWoodTexture = () => {
  if (cache.table) return cache.table
  const size = 512
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#a9754c'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(78,48,28,0.22)'
  ctx.lineWidth = 1.4
  for (let k = 0; k < 42; k++) {
    const y = Math.random() * size
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= size; x += 24) {
      ctx.lineTo(x, y + Math.sin(x * 0.02 + k * 1.3) * 3.2)
    }
    ctx.stroke()
  }
  // manchas de tinta do trabalho
  for (let k = 0; k < 14; k++) {
    ctx.fillStyle = `rgba(${140 + Math.random() * 80},${90 + Math.random() * 60},${70},0.10)`
    ctx.beginPath()
    ctx.ellipse(Math.random() * size, Math.random() * size, 6 + Math.random() * 22, 5 + Math.random() * 16, Math.random() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  noise(ctx, size, 12)
  cache.table = finish(c, [2, 1], 8)
  return cache.table
}

/** Parede rebocada, com variacao bem de leve. */
export const plasterTexture = () => {
  if (cache.plaster) return cache.plaster
  const size = 256
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#e6d9c6'
  ctx.fillRect(0, 0, size, size)
  for (let k = 0; k < 220; k++) {
    ctx.fillStyle = `rgba(${200 + Math.random() * 40},${185 + Math.random() * 35},${165 + Math.random() * 30},0.30)`
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, 2 + Math.random() * 14, 0, Math.PI * 2)
    ctx.fill()
  }
  noise(ctx, size, 10)
  cache.plaster = finish(c, [3, 2], 4)
  return cache.plaster
}

/** Cortica do mural de fotos. */
export const corkTexture = () => {
  if (cache.cork) return cache.cork
  const size = 256
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#c69a68'
  ctx.fillRect(0, 0, size, size)
  for (let k = 0; k < 900; k++) {
    const shade = Math.random() > 0.5 ? '160,120,78' : '214,178,132'
    ctx.fillStyle = `rgba(${shade},${0.2 + Math.random() * 0.45})`
    ctx.beginPath()
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      1.5 + Math.random() * 5,
      1.5 + Math.random() * 4,
      Math.random() * 3,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  noise(ctx, size, 14)
  cache.cork = finish(c, [1, 1], 4)
  return cache.cork
}

/** Tapete de trabalho em cima da mesa (aquele verde de corte). */
export const matTexture = () => {
  if (cache.mat) return cache.mat
  const size = 256
  const [c, ctx] = canvas(size)
  ctx.fillStyle = '#4c6153'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(232,240,232,0.20)'
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += 16) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }
  noise(ctx, size, 8)
  cache.mat = finish(c, [1, 1], 4)
  return cache.mat
}

/** Placa de madeira com o nome do ateliê, pendurada na parede.
 *  Desenhar o texto em canvas evita carregar fonte 3D so para uma placa. */
export const signTexture = () => {
  if (cache.sign) return cache.sign
  const w = 512
  const h = 248
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')

  ctx.fillStyle = '#8a5a44'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(60,36,22,0.45)'
  ctx.lineWidth = 2
  for (let k = 0; k < 24; k++) {
    const y = Math.random() * h
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x * 0.02 + k) * 2.5)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(247,241,232,0.55)'
  ctx.lineWidth = 3
  ctx.strokeRect(16, 16, w - 32, h - 32)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#f7f1e8'
  ctx.font = '600 78px Georgia, "Times New Roman", serif'
  ctx.fillText('Brasa Cubas', w / 2, h / 2 - 22)
  ctx.font = '400 30px Georgia, "Times New Roman", serif'
  ctx.fillStyle = 'rgba(247,241,232,0.78)'
  ctx.fillText('ateliê de porcelana fria', w / 2, h / 2 + 46)

  cache.sign = finish(c, [1, 1], 8)
  return cache.sign
}

/** Vidro da janela: luz estourada em cima, verde do quintal embaixo. */
export const windowTexture = () => {
  if (cache.win) return cache.win
  const w = 128
  const h = 256
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#fffdf6')
  grad.addColorStop(0.55, '#fff3dc')
  grad.addColorStop(0.82, '#e9e6c4')
  grad.addColorStop(1, '#cbd6ac')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  // folhagem fora de foco na parte de baixo
  for (let k = 0; k < 40; k++) {
    ctx.fillStyle = `rgba(${120 + Math.random() * 50},${145 + Math.random() * 45},${95 + Math.random() * 40},0.3)`
    ctx.beginPath()
    ctx.arc(Math.random() * w, h * 0.78 + Math.random() * h * 0.22, 6 + Math.random() * 22, 0, Math.PI * 2)
    ctx.fill()
  }
  cache.win = finish(c, [1, 1], 4)
  return cache.win
}

export const disposeTextures = () => {
  Object.values(cache).forEach((t) => t.dispose())
  cache = {}
}
