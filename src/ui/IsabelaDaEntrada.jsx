import { FlorQueAbre } from './FlorQueAbre'

// A Isabela da tela de entrada.
//
// Ela existe SO AQUI: aparece enquanto a pessoa escolhe entre o ateliê 3D e a
// lista, e some no instante em que alguem entra — dentro da cena nao ha figura
// nenhuma. Isso e decisao do dono, depois de ver a versao 3D dela na bancada:
// "queria ele na animacao de entrada so, interagindo enquanto seleciona 3d ou
// lista, e ela some depois".
//
// DESENHO, NAO RETRATO. Ela e uma pessoa de verdade. O bonequinho tem cabelo
// comprido, jardineira e tatuagem fina, e o rosto e dois pontos e uma boca —
// generico de proposito. A aprovacao dela vem antes de isto ir para a `main`.
//
// SVG a mao, sem arquivo e sem biblioteca: esta tela aparece ENQUANTO o pacote
// do 3D (272 KB comprimidos) baixa, e qualquer KB aqui atrasa exatamente o que
// ela espera. A flor que ja existia continua sendo o sinal de progresso — agora
// na mao dela, que e o que a faz parecer estar modelando.
//
// A animacao inteira e opt-in, dentro da media query de movimento: com
// movimento reduzido fica a figura parada, nunca um palco vazio.

// Onde a mao esta, em porcentagem da caixa (a mao fica em 88,146 de 180x330).
// A flor entra por cima, com a BASE da haste caindo na mao.
const FLOR = { largura: 39, esquerda: 29.5, topo: 28.5 }

export function IsabelaDaEntrada({ pronta }) {
  return (
    <div
      className={`isabela-entrada relative h-full ${pronta ? 'isabela-entrada--pronta' : ''}`}
      style={{ aspectRatio: '180 / 330' }}
    >
      <svg viewBox="0 0 180 330" aria-hidden="true" className="isabela-corpo h-full w-full">
  <defs>
    <linearGradient id="ib-pele" gradientUnits="userSpaceOnUse" x1="44" y1="30" x2="140" y2="300">
      <stop offset="0" stopColor="#f7dfca"/><stop offset="1" stopColor="#dcae90"/>
    </linearGradient>
    <linearGradient id="ib-roupa" gradientUnits="userSpaceOnUse" x1="50" y1="90" x2="132" y2="300">
      <stop offset="0" stopColor="#f1e6d3"/><stop offset="1" stopColor="#cbb99c"/>
    </linearGradient>
    <linearGradient id="ib-cabelo" gradientUnits="userSpaceOnUse" x1="48" y1="28" x2="132" y2="180">
      <stop offset="0" stopColor="#70482f"/><stop offset="1" stopColor="#3b2519"/>
    </linearGradient>
    <radialGradient id="ib-luz" cx="0.5" cy="0.4" r="0.52">
      <stop offset="0" stopColor="#f7f1e8" stopOpacity="0.12"/>
      <stop offset="0.85" stopColor="#f7f1e8" stopOpacity="0"/>
    </radialGradient>
  </defs>

  <ellipse cx="90" cy="158" rx="88" ry="166" fill="url(#ib-luz)"/>

  {/* CABELO DE TRAS: massa larga com pontas onduladas na altura do cotovelo */}
  <path d="M90 28 C116 28 131 46 130 70 C129 94 135 120 133 148 C132 162 128 172 123 178
           C121 168 116 165 111 170 C114 140 112 110 110 90 L70 90 C68 110 66 140 69 170
           C64 165 59 168 57 178 C52 172 48 162 47 148 C45 120 51 94 50 70 C49 46 64 28 90 28 Z"
        fill="url(#ib-cabelo)" stroke="#8a5a3c" strokeWidth="1.6" strokeOpacity="0.55"/>

  {/* PESCOCO */}
  <path d="M81 78 h18 v22 q-9 7 -18 0 Z" fill="#dcae90"/>

  {/* CABECA */}
  <ellipse cx="90" cy="60" rx="26" ry="29" fill="url(#ib-pele)"/>

  {/* FRANJA: cobre so a testa; o resto do rosto fica livre */}
  <path d="M64 50 C66 34 76 27 90 27 C105 27 116 36 116 52 C110 41 99 37 88 40 C78 43 70 46 64 50 Z" fill="#5e3c29"/>
  <path d="M64 50 C60 45 56 42 52 43 C50 55 51 66 53 74 C55 64 59 55 64 50 Z" fill="#4a2f22"/>
  <path d="M116 52 C121 47 125 44 128 45 C130 57 129 68 127 76 C125 66 121 57 116 52 Z" fill="#4a2f22"/>

  {/* ROSTO */}
  <ellipse cx="80" cy="62" rx="2.4" ry="2.9" fill="#3f2a1e"/>
  <ellipse cx="100" cy="62" rx="2.4" ry="2.9" fill="#3f2a1e"/>
  <path d="M85 71 q5 4.5 10 0" stroke="#b3806a" strokeWidth="1.7" fill="none" strokeLinecap="round"/>
  <ellipse cx="72" cy="68" rx="4.2" ry="2.6" fill="#e9a98a" opacity="0.45"/>
  <ellipse cx="108" cy="68" rx="4.2" ry="2.6" fill="#e9a98a" opacity="0.45"/>

  {/* BRACOS (atras do tronco) */}
  <path d="M116 104 q14 10 16 34 q3 24 2 42 q-9 6 -16 0 q1 -22 -1 -39 q-2 -20 -10 -31 Z" fill="url(#ib-pele)"/>
  <path d="M134 180 q5 13 -3 19 q-11 5 -16 -4 q-1 -9 1 -15 Z" fill="#f3d4bc"/>

  {/* TATUAGEM: traco fino, desenho generico */}
  <g stroke="#c08f6f" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.95">
    <path d="M52 128 q4 -5 9 -2"/><path d="M51 140 q5 -4 9 -1"/><path d="M58 152 q5 -3 8 -4"/>
    <path d="M117 138 q5 4 9 1"/><path d="M119 152 q4 -4 8 -1"/><path d="M118 166 q4 -3 7 -1"/>
  </g>

  {/* REGATA BRANCA */}
  <path d="M61 104 q6 -19 29 -19 q23 0 29 19 q3 14 2 31 h-62 q-1 -17 2 -31 Z" fill="#fbf8f2"/>
  <path d="M80 96 q10 8 20 0 q-4 12 -10 12 q-6 0 -10 -12 Z" fill="#f2dfc9"/>

  {/* CALCA */}
  <path d="M66 146 h48 q10 26 9 52 h-66 q-1 -26 9 -52 Z" fill="url(#ib-roupa)"/>
  <path d="M58 196 h29 q-1 44 -2 84 h-25 q-2 -42 -2 -84 Z" fill="url(#ib-roupa)"/>
  <path d="M92 196 h29 q0 42 -2 84 h-25 q-1 -40 -2 -84 Z" fill="url(#ib-roupa)"/>
  <rect x="62" y="268" width="30" height="12" rx="5" fill="#ddcdb0"/>
  <rect x="90" y="268" width="30" height="12" rx="5" fill="#ddcdb0"/>
  <path d="M66 280 h22 q4 12 -3 16 h-17 q-4 -7 -2 -16 Z" fill="#f0cdb4"/>
  <path d="M94 280 h22 q2 9 -2 16 h-17 q-7 -4 -3 -16 Z" fill="#f0cdb4"/>

  {/* PEITILHO E ALCAS DA JARDINEIRA */}
  <path d="M73 120 h34 v30 h-34 Z" fill="url(#ib-roupa)"/>
  <path d="M73 122 q-2 -14 -6 -24 l7 -2 q5 12 6 26 Z" fill="#e9dcc6"/>
  <path d="M107 122 q2 -14 6 -24 l-7 -2 q-5 12 -6 26 Z" fill="#e9dcc6"/>
  <rect x="72.5" y="119" width="5" height="5" rx="1.4" fill="#c2582d"/>
  <rect x="102.5" y="119" width="5" height="5" rx="1.4" fill="#c2582d"/>
  <rect x="80" y="128" width="20" height="15" rx="3" fill="#dfd0b6"/>

  {/* BRACO DOBRADO, por cima da roupa: a mao segura a flor que abre enquanto o
                 ateliê carrega. Desenhado depois do peitilho de proposito — atras dele o
                 antebraco sumia. */}
  <path d="M65 102 q-15 14 -18 34 q-3 12 -2 20 q9 6 16 1 q0 -11 2 -19 q3 -16 12 -26 Z" fill="url(#ib-pele)"/>
  <path d="M47 148 q18 -12 38 -13 q6 6 2 14 q-19 2 -34 9 Z" fill="url(#ib-pele)"/>
  <ellipse cx="88" cy="146" rx="9.5" ry="8.5" fill="#f3d4bc"/>
      </svg>
      <div className="isabela-flor absolute" style={{ width: `${FLOR.largura}%`, left: `${FLOR.esquerda}%`, top: `${FLOR.topo}%` }}>
        <FlorQueAbre pronta={pronta} />
      </div>
    </div>
  )
}
