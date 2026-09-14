// Miniatura da peca para as listas. Nao e foto: e a silhueta da peca
// preenchida com as cores dela. Funciona sem nenhum arquivo de imagem e
// segue legivel no modo simples.

const SHAPES = {
  vaso: (c) => (
    <>
      <path d="M26 58c0-8 5-12 5-20s-4-9-4-14h30c0 5-4 6-4 14s5 12 5 20-8 14-16 14-16-6-16-14Z" fill={c.body} />
      <path d="M27 58c0-5 2-8 3-12h28c1 4 3 7 3 12 0 7-7 12-17 12s-17-5-17-12Z" fill={c.accent} opacity="0.9" />
      <rect x="25" y="20" width="34" height="5" rx="2.5" fill={c.body} />
    </>
  ),
  arranjo: (c) => (
    <>
      <path d="M28 46h28l-3 22a4 4 0 0 1-4 4H35a4 4 0 0 1-4-4L28 46Z" fill={c.body} />
      <path d="M29 54h26l-1.6 14a4 4 0 0 1-4 4H34.6a4 4 0 0 1-4-4L29 54Z" fill={c.accent} opacity="0.85" />
      <circle cx="30" cy="30" r="8" fill={c.petal} />
      <circle cx="42" cy="20" r="9" fill={c.petal} />
      <circle cx="55" cy="31" r="8" fill={c.petal} />
      <circle cx="42" cy="20" r="3" fill={c.accent} />
      <path d="M42 44V26M31 44l-1-10M53 44l2-9" stroke={c.leaf} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  caneca: (c) => (
    <>
      <rect x="24" y="26" width="32" height="42" rx="5" fill={c.body} />
      <path d="M56 36h6a8 8 0 0 1 0 16h-6" stroke={c.body} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="34" cy="44" r="5" fill={c.petal} />
      <circle cx="46" cy="52" r="4" fill={c.petal} />
      <circle cx="34" cy="44" r="1.8" fill={c.accent} />
    </>
  ),
  prato: (c) => (
    <>
      <circle cx="42" cy="46" r="28" fill={c.body} />
      <circle cx="42" cy="46" r="18" fill={c.accent} opacity="0.25" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2
        return <circle key={i} cx={42 + Math.cos(a) * 24} cy={46 + Math.sin(a) * 24} r="4.5" fill={c.petal} />
      })}
    </>
  ),
  portajoias: (c) => (
    <>
      <path d="M18 54a24 24 0 0 1 48 0v10a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V54Z" fill={c.body} />
      <path d="M18 56h48v8a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4v-8Z" fill={c.accent} opacity="0.8" />
      <circle cx="42" cy="32" r="8" fill={c.petal} />
      <circle cx="42" cy="32" r="3" fill={c.accent} />
    </>
  ),
  topo: (c) => (
    <>
      <rect x="16" y="60" width="52" height="9" rx="4.5" fill={c.body} />
      <path d="M30 60c0-12 3-18 3-24a4 4 0 0 1 8 0c0 6 3 12 3 24H30Z" fill={c.body} />
      <path d="M46 60c0-11 2-16 2-21a3.5 3.5 0 0 1 7 0c0 5 2 10 2 21H46Z" fill={c.accent} />
      <circle cx="37" cy="26" r="5.5" fill={c.body} />
      <circle cx="51" cy="28" r="5" fill={c.body} />
      <circle cx="24" cy="58" r="5" fill={c.petal} />
      <circle cx="62" cy="58" r="4.5" fill={c.petal} />
    </>
  ),
  numero: (c) => (
    <>
      <path
        d="M28 24a14 14 0 1 1 10 24 14 14 0 1 1-10 24"
        stroke={c.body}
        strokeWidth="11"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="30" cy="20" r="5" fill={c.petal} />
      <circle cx="46" cy="30" r="4.5" fill={c.petal} />
      <circle cx="40" cy="47" r="4.5" fill={c.petal} />
      <circle cx="48" cy="62" r="5" fill={c.petal} />
      <circle cx="29" cy="74" r="4.5" fill={c.petal} />
    </>
  ),
  lembrancinha: (c) => (
    <>
      <path d="M32 52h22l-2.5 18a4 4 0 0 1-4 3.5h-9A4 4 0 0 1 34.5 70L32 52Z" fill={c.body} />
      <path d="M33 60h20l-1.5 10a4 4 0 0 1-4 3.5h-9A4 4 0 0 1 34.5 70L33 60Z" fill={c.accent} opacity="0.85" />
      <circle cx="35" cy="36" r="7" fill={c.petal} />
      <circle cx="50" cy="32" r="7.5" fill={c.petal} />
      <circle cx="43" cy="44" r="6" fill={c.petal} />
      <path d="M43 52v-8M35 50l-1-7M50 50l1-11" stroke={c.leaf} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  ima: (c) => (
    <>
      <circle cx="42" cy="48" r="24" fill={c.body} />
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2
        return <ellipse key={i} cx={42 + Math.cos(a) * 12} cy={48 + Math.sin(a) * 12} rx="9" ry="7" fill={c.petal} transform={`rotate(${(i / 5) * 360} ${42 + Math.cos(a) * 12} ${48 + Math.sin(a) * 12})`} />
      })}
      <circle cx="42" cy="48" r="6" fill={c.accent} />
    </>
  ),
  figura: (c) => (
    <>
      <path d="M28 70c0-18 5-24 5-30a9 9 0 0 1 18 0c0 6 5 12 5 30H28Z" fill={c.accent} />
      <circle cx="42" cy="26" r="11" fill={c.body} />
      <path d="M42 15a11 11 0 0 1 11 10c-3-3-7-4-11-4s-8 1-11 4A11 11 0 0 1 42 15Z" fill={c.accent} />
      <circle cx="26" cy="52" r="4.5" fill={c.body} />
      <circle cx="58" cy="52" r="4.5" fill={c.body} />
    </>
  ),
}

export function PieceThumb({ piece, size = 64, className = '' }) {
  const colors = {
    body: piece.body ?? '#f2e7d5',
    accent: piece.accent ?? '#c2582d',
    petal: piece.petal ?? '#f0c3c6',
    leaf: piece.leaf ?? '#8fa089',
  }
  const draw = SHAPES[piece.kind] ?? SHAPES.vaso

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-xl ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(120% 110% at 30% 20%, #fdfaf4 0%, ${colors.body}55 55%, ${colors.accent}22 100%)`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 84 90" aria-hidden="true">
        <ellipse cx="42" cy="76" rx="26" ry="5" fill="#2b2320" opacity="0.1" />
        {draw(colors)}
      </svg>
    </span>
  )
}
