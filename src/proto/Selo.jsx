import { useEffect, useRef, useState } from 'react'
import { proto } from './bandeiras'
import { vidro } from '../ui/vidro'

// Selo de teste: o ponto no canto que diz qual variante esta no ar e serve de
// menu para trocar de variante no celular.
//
// Por que ele existe: digitar `?nav=estacoes&teto=3.05` no Safari do iPhone e
// castigo. Ele abre a URL uma vez e troca de variante tocando aqui.
//
// Cinco decisoes que nao sao gosto:
//
// - ESTILO INLINE, sem classe do Tailwind. O Tailwind v4 varre o projeto
//   inteiro e escreve um CSS unico: classe usada so aqui vazaria para o CSS do
//   site publicado.
// - PONTO de 28 px, nao pilula escrita. A faixa de cima ja tem o chip de
//   posicao, a casa e o botao de lista, que em 375 terminam perto de x 236: uma
//   pilula com o texto todo sobraria 6 px e em 320 cobriria o chip.
// - O ESTADO MORA AQUI. No App, cada toque re-renderizaria o Experience e o
//   Canvas reaplicaria frameloop, dpr e shadows.
// - Trocar de variante e um <a> de verdade, nao pushState: as bandeiras sao
//   lidas na importacao do modulo, entao so uma navegacao completa troca de
//   navegacao. De quebra, o voltar do Safari anda entre as variantes.
// - COPIAR e o botao principal, e nao o voto: o localStorage e por origem e
//   some na aba anonima. O voto e conveniencia; o que chega em mim e o texto
//   colado no WhatsApp.

const CHAVE = 'brasa-proto-notas'
const LIMITE = 40

const LETRA = { atual: 'A', trilho: 'T', orbita: 'O', estacoes: 'E' }

const NAVS = [
  ['atual', 'Como esta hoje'],
  ['trilho', 'Trilho'],
  ['orbita', 'Orbita com corte'],
  ['estacoes', 'Estacoes'],
]
const TETOS = [
  ['2.9', '2,90 m (hoje)'],
  ['3.05', '3,05 m'],
  ['3.2', '3,20 m'],
]
const BARRAS = [
  ['atual', 'Como esta hoje'],
  ['b1', 'Mais alta, com icone'],
]

const ler = () => {
  try {
    const bruto = localStorage.getItem(CHAVE)
    const lista = bruto ? JSON.parse(bruto) : []
    return Array.isArray(lista) ? lista : []
  } catch (e) {
    return []
  }
}

const gravar = (lista) => {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista.slice(-LIMITE)))
    return true
  } catch (e) {
    return false
  }
}

// Hash do build, tirado do proprio script carregado: diz qual deploy ele testou
// sem eu precisar configurar nada no Vite.
const buildAtual = () => {
  const s = document.querySelector('script[type=module]')
  const m = s && s.src.match(/index-([A-Za-z0-9_-]+)\.js/)
  return m ? m[1] : 'dev'
}

const endereco = (mudanca) => {
  const p = new URLSearchParams({ nav: proto.nav, teto: String(proto.teto), barra: proto.barra, ...mudanca })
  return `?${p.toString()}`
}

const anotacoes = (lista) =>
  lista
    .map((n) => `${n.v > 0 ? '+' : '-'} ${n.q} | ${n.w}x${n.h} | ${n.build}${n.obs ? ` | ${n.obs}` : ''}`)
    .join('\n')

export function Selo() {
  const [aberto, setAberto] = useState(false)
  const [notas, setNotas] = useState(ler)
  const [aviso, setAviso] = useState('')
  const fechar = useRef(null)

  useEffect(() => {
    if (!aberto) return
    fechar.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [aberto])

  if (!proto.ligado) return null

  const votar = (v) => {
    const nova = [
      ...notas,
      { q: proto.resumo, v, w: window.innerWidth, h: window.innerHeight, build: buildAtual() },
    ]
    setNotas(nova)
    setAviso(gravar(nova) ? 'Anotado.' : 'Anotei so nesta tela: o armazenamento esta bloqueado.')
  }

  const copiar = () => {
    // O texto e montado ANTES: no Safari do iPhone, um await antes do
    // writeText faz a copia ser recusada em silencio.
    const texto = `Brasa Cubas — teste de navegacao\n${anotacoes(notas) || '(sem votos)'}`
    try {
      navigator.clipboard.writeText(texto)
      setAviso('Copiado. Cola no WhatsApp.')
    } catch (e) {
      setAviso(texto)
    }
  }

  const problema = proto.recusados.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-label={`Teste de navegacao: ${proto.resumo}`}
        style={{
          position: 'fixed',
          top: '3.4rem',
          right: 'max(0.75rem, env(safe-area-inset-right))',
          zIndex: 47,
          width: 28,
          height: 28,
          borderRadius: 999,
          border: '1px solid rgba(247,241,232,0.35)',
          background: problema ? '#a94b24' : 'rgba(43,35,32,0.86)',
          color: '#f7f1e8',
          font: '600 12px/1 ui-sans-serif, system-ui',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          ...vidro(6),
        }}
      >
        <span key={problema ? 'erro' : proto.nav}>{problema ? '!' : (LETRA[proto.nav] ?? '?')}</span>
      </button>

      {aberto && (
        <div
          role="dialog"
          aria-label="Variantes de teste"
          style={{
            position: 'fixed',
            top: '5.4rem',
            right: 'max(0.75rem, env(safe-area-inset-right))',
            left: 'max(0.75rem, env(safe-area-inset-left))',
            maxWidth: 320,
            marginLeft: 'auto',
            zIndex: 47,
            background: 'rgba(43,35,32,0.95)',
            color: '#f7f1e8',
            borderRadius: 14,
            border: '1px solid rgba(247,241,232,0.16)',
            padding: 14,
            font: '400 13px/1.45 ui-sans-serif, system-ui',
            maxHeight: '70svh',
            overflowY: 'auto',
            ...vidro(10),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: 8 }}>
            <strong style={{ font: '600 13px/1.3 ui-sans-serif, system-ui' }}>Teste de navegação</strong>
            <button
              ref={fechar}
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar"
              style={{
                marginLeft: 'auto',
                minWidth: 32,
                minHeight: 32,
                borderRadius: 999,
                border: 0,
                background: 'transparent',
                color: '#f7f1e8',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>

          <p key={proto.resumo} style={{ margin: '2px 0 0', opacity: 0.8, fontSize: 12 }}>
            {proto.resumo} · build {buildAtual()} · {window.innerWidth}×{window.innerHeight}
          </p>

          {problema && (
            <p style={{ margin: '8px 0 0', color: '#ffd7c4', fontSize: 12 }}>
              Não entendi {proto.recusados.join(', ')} — está rodando o padrão.
            </p>
          )}

          {[
            ['Navegação', NAVS, 'nav', proto.nav],
            ['Teto', TETOS, 'teto', String(proto.teto)],
            ['Barra de baixo', BARRAS, 'barra', proto.barra],
          ].map(([titulo, opcoes, chave, atual]) => (
            <div key={chave} style={{ marginTop: 12 }}>
              <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.65 }}>
                {titulo}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {opcoes.map(([valor, rotulo]) => (
                  <a
                    key={valor}
                    href={endereco({ [chave]: valor })}
                    aria-current={valor === atual ? 'page' : undefined}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      minHeight: 36,
                      padding: '0 12px',
                      borderRadius: 999,
                      textDecoration: 'none',
                      fontSize: 12.5,
                      background: valor === atual ? '#f7f1e8' : 'rgba(247,241,232,0.12)',
                      color: valor === atual ? '#2b2320' : '#f7f1e8',
                    }}
                  >
                    {rotulo}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {[
              [1, 'Gostei'],
              [-1, 'Não gostei'],
            ].map(([v, rotulo]) => (
              <button
                key={rotulo}
                type="button"
                onClick={() => votar(v)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 10,
                  border: '1px solid rgba(247,241,232,0.25)',
                  background: 'transparent',
                  color: '#f7f1e8',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={copiar}
            style={{
              width: '100%',
              minHeight: 44,
              marginTop: 6,
              borderRadius: 10,
              border: 0,
              background: '#c2582d',
              color: '#f7f1e8',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Copiar anotações ({notas.length})
          </button>

          {aviso && (
            <pre
              key={aviso}
              style={{
                margin: '8px 0 0',
                whiteSpace: 'pre-wrap',
                fontSize: 11.5,
                opacity: 0.85,
                font: '400 11.5px/1.4 ui-monospace, monospace',
              }}
            >
              {aviso}
            </pre>
          )}
        </div>
      )}
    </>
  )
}
