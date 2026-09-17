// Tradutor do navegador (Chrome, Edge) com a pagina traduzida.
//
// Foz do Iguacu e fronteira: visita com o navegador em espanhol traduz a pagina
// sozinha. O tradutor TROCA cada no de texto por <font> com o texto traduzido. O
// React continua segurando o no antigo e, quando precisa tira-lo ou inserir algo
// antes dele, o DOM lanca "o no nao e filho deste" — e a arvore inteira cai.
// Medido com um tradutor falso que faz a mesma troca: o site ia para "Algo deu
// errado" no segundo "Proximo" da apresentacao (o titulo do card mistura texto e
// icone). E o problema conhecido do React com tradutores (facebook/react#11538).
//
// Esta e a rede de seguranca sugerida la: se o no ja nao e filho, nao lanca. Ela
// so evita a queda; o texto que troca no lugar precisa de `key` para o tradutor
// ver o texto novo (ver os pontos marcados com "tradutor" nos componentes).
export function protegerDoTradutor() {
  if (typeof Node !== 'function' || !Node.prototype) return
  const removeChild = Node.prototype.removeChild
  Node.prototype.removeChild = function (filho) {
    if (filho.parentNode !== this) return filho
    return removeChild.call(this, filho)
  }
  const insertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (novo, referencia) {
    if (referencia && referencia.parentNode !== this) return novo
    return insertBefore.call(this, novo, referencia)
  }
}
