// Desfoque do que esta atras (vidro fosco) nas pecas de interface sobre a cena.
//
// Com o prefixo junto: Safari so aceita `backdrop-filter` sem prefixo a partir
// da versao 18. No iOS 16 e 17 — e no navegador do Instagram nesses aparelhos,
// que usa o motor do sistema — o estilo inline sem prefixo nao desfocava nada. O
// Tailwind ja gera os dois nas classes; estes eram os estilos escritos a mao. O
// desfoque nao e enfeite em todos: o chip da camera e `bg-carvao/55`, e o
// contraste dele (5,18) foi medido com o fundo real desfocado atras.
export const vidro = (px) => ({
  backdropFilter: `blur(${px}px)`,
  WebkitBackdropFilter: `blur(${px}px)`,
})
