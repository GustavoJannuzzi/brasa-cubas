// A florzinha que abre enquanto o ateliê carrega.
//
// Por que uma flor, e nao um torno: porcelana fria e massa de cola com amido,
// modelada A MAO e seca ao ar — torno seria de outro material, e o catalogo dela
// e cheio de flor. Aqui a bolinha de massa vira petala por petala, que e o que
// ela faz de verdade.
//
// Quatro regras que valem mais que o desenho:
//
// 1. SVG e CSS, nada de biblioteca. Esta tela aparece ENQUANTO o pacote do 3D
//    (272 KB comprimidos) ainda esta baixando: qualquer KB aqui atrasa
//    exatamente o que ela espera. Sao ~1,4 KB de marcacao, sem nenhuma
//    requisicao a mais.
// 2. A ANIMACAO E OPT-IN, dentro de uma media query de movimento. Sem ela — com
//    movimento reduzido, ou se o CSS nao carregar — o que fica na tela e a flor
//    PRONTA, nao um palco vazio. Estado escondido por padrao e o que apaga
//    conteudo quando algo falha.
// 3. Nao finge progresso. A flor gira em looping enquanto monta e PARA aberta
//    quando o ateliê fica pronto: a quietude e o aviso de que acabou, a mesma
//    regra da barra que esta tela ja seguia.
// 4. aria-hidden: e enfeite. Quem usa leitor de tela ouve o texto de status
//    logo abaixo, que diz o mesmo em palavra.

export function FlorQueAbre({ pronta }) {
  // Seis petalas em volta do miolo, cada uma com o proprio atraso: e o que faz
  // a flor "abrir" em vez de aparecer inteira.
  const petalas = [0, 1, 2, 3, 4, 5]

  return (
    // Sem largura fixa: a flor mora na MAO da figura da entrada e acompanha o
    // tamanho dela, que encolhe junto com a altura da tela.
    <svg viewBox="0 0 140 140" aria-hidden="true" className={`flor block w-full ${pronta ? 'flor--pronta' : ''}`}>
      {/* bancada: so uma sombra de apoio, para a flor nao flutuar no escuro */}
      <ellipse cx="70" cy="116" rx="34" ry="5" fill="#f7f1e8" opacity="0.07" />

      <g className="flor-balanco" style={{ transformOrigin: '70px 104px' }}>
        {/* haste e folhas */}
        <path d="M70 104 L70 74" stroke="#8fa089" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path
          className="flor-folha flor-folha--esq"
          d="M69 94 C58 92 50 85 48 76 C58 76 67 83 69 94 Z"
          fill="#8fa089"
          style={{ transformOrigin: '69px 90px' }}
        />
        <path
          className="flor-folha flor-folha--dir"
          d="M71 99 C82 97 90 90 92 81 C82 81 73 88 71 99 Z"
          fill="#7e9079"
          style={{ transformOrigin: '71px 95px' }}
        />

        {/* petalas */}
        {/* Cada petala vai dentro de um grupo GIRADO, e o CSS so anima a escala
            dela. Nao da para juntar as duas coisas: a propriedade `transform` do
            CSS sobrescreve o atributo `transform` do SVG, e as seis petalas
            empilhavam no mesmo lugar — medido na tela, aparecia uma so. */}
        {petalas.map((i) => (
          <g key={i} transform={`rotate(${i * 60} 70 62)`}>
            <ellipse
              className={`flor-petala flor-petala--${i}`}
              cx="70"
              cy="43"
              rx="11.5"
              ry="17"
              fill={i % 2 ? '#f0c3c6' : '#f5d2d0'}
              style={{ transformOrigin: '70px 62px' }}
            />
          </g>
        ))}
        {/* a bolinha de massa: comeca inteira e encolhe ate virar o miolo */}
        <circle className="flor-massa" cx="70" cy="62" r="15" fill="#f2e2cd" style={{ transformOrigin: '70px 62px' }} />
        <circle className="flor-miolo" cx="70" cy="62" r="7.5" fill="#e07a4f" style={{ transformOrigin: '70px 62px' }} />
      </g>
    </svg>
  )
}
