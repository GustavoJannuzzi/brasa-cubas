import { room, views } from '../../data/scene'

// Protótipo (c): ESTAÇÕES.
//
// Voce para de "girar a sala" e passa a estar EM PE num lugar dela. A camera
// fica cravada no ponto e quem gira e o olhar; tocar um marcador leva para
// outro ponto do ateliê, com o voo curto que ja existe.
//
// Por que isto mata o defeito na raiz: no orbit, camera = alvo + R*u, e a
// biblioteca encurta R contra a parede — e o encurtamento e o que se sente como
// "girar no lugar". Aqui a igualdade e invertida: a CAMERA e o dado fixo e o
// ALVO e derivado. Nao existe raio para encurtar.
//
// Importa `scene.js` (que e dado: medidas e presets), nunca three nem drei.

const GRAU = Math.PI / 180

// Teto do giro, antes do desconto do meio quadro. No celular pode ser maior
// porque a abertura horizontal e menor (32 graus contra 57,7 do desktop).
const TETO_YAW = { celular: 45 * GRAU, tela: 36 * GRAU }
const TETO_PITCH_CIMA = 18 * GRAU
const TETO_PITCH_BAIXO = -16 * GRAU

// Passo da varredura que descobre ate onde ainda ha parede, piso ou teto.
const PASSO = 1 * GRAU

const GANHO = { toque: 1.7, ponteiro: 2.6 }

const travar = (v, min, max) => (v < min ? min : v > max ? max : v)

/**
 * O raio que sai de P na direcao (yaw, pitch) bate em alguma superficie do
 * comodo? Tudo aqui e caixa alinhada aos eixos, entao sao cinco contas de
 * plano, sem raycast e sem three.
 */
const bateNaSala = (P, yaw, pitch) => {
  const dx = Math.sin(yaw) * Math.cos(pitch)
  const dy = Math.sin(pitch)
  const dz = -Math.cos(yaw) * Math.cos(pitch)
  const W = room.halfW
  let melhor = Infinity

  const testar = (t, cx, cy, cz) => {
    if (t > 0 && t < melhor && cx && cy && cz) melhor = t
  }

  const px = (t) => P[0] + dx * t
  const py = (t) => P[1] + dy * t
  const pz = (t) => P[2] + dz * t

  if (dz < 0) {
    const t = (room.wallZ - P[2]) / dz
    testar(t, Math.abs(px(t)) <= W, py(t) >= 0 && py(t) <= room.wallH, true)
  }
  if (dx < 0) {
    const t = (-W - P[0]) / dx
    testar(t, true, py(t) >= 0 && py(t) <= room.wallH, pz(t) >= room.wallZ && pz(t) <= room.leftFrontZ)
  }
  if (dx > 0) {
    const t = (W - P[0]) / dx
    testar(t, true, py(t) >= 0 && py(t) <= room.wallH, pz(t) >= room.wallZ && pz(t) <= room.rightFrontZ)
  }
  if (dy < 0) {
    const t = -P[1] / dy
    testar(t, Math.abs(px(t)) <= W, true, pz(t) >= room.wallZ && pz(t) <= room.floorFrontZ)
  }
  if (dy > 0) {
    const t = (room.wallH - P[1]) / dy
    testar(t, Math.abs(px(t)) <= W, true, pz(t) >= room.wallZ && pz(t) <= room.leftFrontZ)
  }
  return melhor < Infinity
}

/**
 * Ate onde da para virar o olhar sem NENHUM canto do quadro mostrar o vazio de
 * fora do comodo.
 *
 * Duas licoes que sairam da medicao, e as duas custaram um numero errado:
 * 1. testar so o centro das bordas nao serve — quem escapa primeiro e o CANTO;
 * 2. travar so o giro nao serve — na visao geral do celular a camera esta na
 *    frente aberta, e o que mostra o vazio e olhar para CIMA (o teto acaba em
 *    z 1,75 e ela esta em z 2,4). Sem travar o pitch pela mesma conta, o vazio
 *    media 64,7% da tela em retrato.
 *
 * Duas passadas: primeiro a faixa de pitch olhando na direcao da estacao,
 * depois a faixa de giro nas pontas do pitch que sobrou.
 */
const faixaDoOlhar = (P, base, meiaH, meiaV) => {
  const cantosOk = (yaw, pitch) => {
    for (const dv of [-meiaV, 0, meiaV]) {
      for (const dh of [-meiaH, 0, meiaH]) {
        if (!bateNaSala(P, yaw + dh, pitch + dv)) return false
      }
    }
    return true
  }
  const varrer = (teto, testar) => {
    let ultimo = 0
    const passos = Math.floor(teto / PASSO)
    for (let i = 1; i <= passos; i++) {
      if (!testar(i * PASSO)) break
      ultimo = i * PASSO
    }
    return ultimo
  }
  const cima = varrer(TETO_PITCH_CIMA, (d) => cantosOk(base.yaw, base.pitch + d))
  const baixo = varrer(-TETO_PITCH_BAIXO, (d) => cantosOk(base.yaw, base.pitch - d))
  const nasPontas = (yaw) => cantosOk(yaw, base.pitch + cima) && cantosOk(yaw, base.pitch - baixo)
  return {
    pitchMax: base.pitch + cima,
    pitchMin: base.pitch - baixo,
    yawMax: base.yaw + varrer(TETO_YAW.celular, (d) => nasPontas(base.yaw + d)),
    yawMin: base.yaw - varrer(TETO_YAW.celular, (d) => nasPontas(base.yaw - d)),
  }
}

/** Yaw e pitch de uma posicao para um alvo. Yaw 0 olha para o fundo (-z). */
const direcao = (pos, alvo) => {
  const dx = alvo[0] - pos[0]
  const dy = alvo[1] - pos[1]
  const dz = alvo[2] - pos[2]
  const plano = Math.hypot(dx, dz)
  return { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, plano), r: Math.hypot(plano, dy) }
}

export default function criarEstacoes({ celular, toque, reduzido }) {
  const ordem = ['home', 'prateleira', 'mesa', 'orcamento', 'galeria', 'contato']
  const estacoes = ordem.map((id) => {
    const preset = (celular && views[id].mobile) || views[id]
    const base = direcao(preset.position, preset.target)
    return { id, pos: preset.position, base, r: base.r }
  })
  const ganho = toque ? GANHO.toque : GANHO.ponteiro
  // A faixa so depende de (estacao, meia largura, meia altura) do quadro, e a
  // varredura roda a cada pointermove: guardar evita refazer 100 testes de raio
  // por movimento de dedo.
  const guardados = new Map()
  const faixaDe = (i, meiaH, meiaV) => {
    const chave = `${i}|${meiaH.toFixed(3)}|${meiaV.toFixed(3)}`
    let f = guardados.get(chave)
    if (!f) {
      f = faixaDoOlhar(estacoes[i].pos, estacoes[i].base, meiaH, meiaV)
      guardados.set(chave, f)
    }
    return f
  }
  const tetoYaw = celular ? TETO_YAW.celular : TETO_YAW.tela

  return {
    nome: 'estacoes',
    gestosProprios: true,
    // A camera nao se move: nao ha raio para a colisao encurtar.
    colisores: false,

    inicial: ({ pos, alvo }) => {
      // Entra pela estacao mais parecida com a pose atual — PERTO E ALINHADA,
      // nao so perto. Saindo de uma peca em close em frente a estante, a mais
      // proxima podia ser uma que olha para o outro lado, e a virada era
      // instantanea: dois defeitos que se somavam.
      const d = direcao(pos, alvo)
      let melhor = 0
      let nota = Infinity
      estacoes.forEach((e, i) => {
        const dist = Math.hypot(e.pos[0] - pos[0], e.pos[1] - pos[1], e.pos[2] - pos[2])
        // 1 metro de distancia pesa o mesmo que 30 graus de diferenca de olhar.
        let giro = Math.abs(e.base.yaw - d.yaw)
        if (giro > Math.PI) giro = 2 * Math.PI - giro
        const n = dist + giro / (Math.PI / 6)
        if (n < nota) {
          nota = n
          melhor = i
        }
      })
      const est = estacoes[melhor]
      return { i: melhor, yaw: est.base.yaw, pitch: est.base.pitch, zoom: 1 }
    },

    arrastar: (e, { dx, dy, menor, meiaH, meiaV }) => {
      const est = estacoes[e.i]
      const f = faixaDe(e.i, meiaH ?? 0.5, meiaV ?? 0.4)
      return {
        ...e,
        yaw: travar(
          e.yaw - (ganho * dx) / menor,
          Math.max(f.yawMin, est.base.yaw - tetoYaw),
          Math.min(f.yawMax, est.base.yaw + tetoYaw),
        ),
        pitch: travar(e.pitch - (ganho * 0.5 * dy) / menor, f.pitchMin, f.pitchMax),
      }
    },

    // A pinca e LENTE: aproxima o olhar sem tirar a pessoa do lugar. Ver o
    // preco de perto nunca desloca.
    pincar: (e, fator) => ({ ...e, zoom: travar(e.zoom * fator, 1, 2.2) }),

    soltar: (e) => e,

    quadro: (e, dt, tempo, respirar) => {
      const est = estacoes[e.i]
      // O respiro so roda quando a cola autoriza: com a folha aberta no celular
      // ninguem ve a cena, e antes de entrar nao ha cena para ver.
      const yaw = e.yaw + (respirar ? 0.004 * Math.sin(tempo * 0.24) : 0)
      const pitch = e.pitch + (respirar ? 0.0015 * Math.sin(tempo * 0.19) : 0)
      const r = est.r / e.zoom
      return {
        estado: e,
        pose: {
          pos: est.pos,
          alvo: [
            est.pos[0] + r * Math.sin(yaw) * Math.cos(pitch),
            est.pos[1] + r * Math.sin(pitch),
            est.pos[2] - r * Math.cos(yaw) * Math.cos(pitch),
          ],
        },
        vivo: false,
      }
    },

    lugar: (e) => {
      const nomes = {
        home: 'Visão geral',
        prateleira: 'Na frente da prateleira',
        mesa: 'Ao lado da bancada',
        orcamento: 'Junto do caderno',
        galeria: 'Em frente ao mural',
        contato: 'Perto do telefone',
      }
      return nomes[estacoes[e.i].id]
    },
  }
}
