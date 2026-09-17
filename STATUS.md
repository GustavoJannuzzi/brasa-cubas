# Status — 17/09/2026

Duas rodadas terminadas e **verificadas na tela**: a refatoração 3D (fase 1) e
os quinze primeiros itens do raio-x de UX (fase 2), cada um medido no navegador
antes de virar commit. O que esta página guarda: o que mudou, o que foi medido,
o que ficou pendente e as divergências entre os dados fictícios daqui e os
fatos já verificados da Isabela (no projeto pai).

## 1. Refatoração: feito e verificado

Verificação feita no Chrome com GPU (Intel UHD), em 1440×900 e em 375×812, com
os fluxos percorridos de ponta a ponta.

### Câmera (`src/three/CameraRig.jsx`, `orbit` em `src/data/scene.js`)

| Antes | Agora |
| --- | --- |
| Meia tela de arrasto parava a câmera em x 3,22 — **atrás da parede direita**, que virava 70% da tela | As paredes são `colliderMeshes`: no limite do giro a distância cai de 3,48 m para 2,05 m e a câmera para **dentro** do cômodo |
| Arrastar para baixo levava a câmera a y 4,62 e o zoom máximo a y 6,01, **acima do teto** (plano de uma face só) | Altura presa entre `cameraMinY` 0,32 e `cameraMaxY` 2,45, recalculada por quadro a partir da distância e do alvo de destino |
| `acos` podia receber valor fora de [-1, 1] e o limite virava `NaN` (câmera some) | Valor sempre com `clamp`, e a faixa nunca fica invertida |
| O limite só era aplicado ao girar: zoom e pan tiravam a câmera da faixa | Fora da faixa, `rotatePolarTo` devolve com transição |
| Alvos de preset fora da caixa (galeria x -1,82; prateleira z -1,52) + `boundaryFriction` 0,32: um pixel de pan arremessava o alvo | Caixa contém todos os presets (`min` x -1,85, z -1,56) e atrito 0 (clamp puro). Pan de 2 px não desloca nada |
| Respiro somava `delta` sem teto e disputava com o arrasto | Só roda com `currentAction` parada e com `delta` limitado a 50 ms |

### Cena

- **Vista da prateleira**: no desktop a câmera estava a 1,84 m e **cortava a
  tábua de cima** (3 dos 11 produtos ficavam atrás do menu). Agora está a 2,61 m
  e as 11 peças aparecem com etiqueta em 1440×900, 1280×720 e 1024×768. Em
  retrato a distância passou a ser calculada pela largura (3,57 m): as cinco
  colunas cabem na tela.
- **Etiqueta de preço**: a classe `.etiqueta-peca` não existia no CSS — nome e
  preço ficavam soltos sobre a madeira. Agora tem o mesmo acabamento do rótulo
  dos pontos da cena (`src/index.css`).
- **Placa do ateliê**: a jiboia pendurada cobria 43% dela na visão geral (medido
  projetando os vértices da planta na tela). Mudou para x -1,38, corda 0,22 e
  escala 0,8: placa livre, mural no máximo 3% coberto, planta ainda visível.
- **Sombra**: `shadows="soft"` só gerava aviso — o PCFSoftShadowMap foi removido
  no three 0.186. Agora é `percentage` com `shadow-radius`, que é o que dá a
  borda macia de verdade.

### Plantas

Corrigido o que duas análises independentes mediram (colisão/apoio e
eixos/normais), com script próprio conferindo antes e depois:

- **Hastes, pecíolos, nervuras, cordas e pés do banquinho estavam do avesso**:
  `tubo()` montava a malha com as normais para dentro, e o material é de face
  simples. Medido pelo volume assinado: hastes de 1/10 para **11/0** com faces
  para fora; cordas de 0/3 para **3/0**.
- **Braço do cacto** saía 90° fora do pretendido, horizontal para dentro do
  tronco (a coluna cresce em +y e o `aim` alinha o +z).
- **Folhas da hera** ficavam de espeto para fora da parede, com a face para
  cima; o `aim` ganhou uma referência de "para cima" e agora elas deitam na
  parede. As duas heras também estavam 3–5 cm descoladas.
- **Suporte de parede** usava aro de 7,5 cm para qualquer vaso: na suculenta o
  aro tinha o dobro do raio do vaso e não segurava nada, e o braço ora entrava
  5 cm na parede, ora parava 2 cm antes. Agora as medidas vêm do dado
  (`bracket: { r, alt, comp }`).
- **Jiboia da prateleira**: os ramos atravessavam a própria tábua. Com `frente`,
  eles caem só para a frente dela.
- **Banquinho da samambaia** flutuava 4,5 cm (a altura é montada no espaço local
  e o grupo ainda aplica escala) e tinha o **tampo do avesso**.
- Mais: folhas da jiboia apontando para o eixo da planta, roll da espada em 2π
  (metade das folhas caía para dentro do leque), folíolos da samambaia
  perpendiculares ao plano da fronde, terra vazando pela parede do vaso, fundo
  de vaso aberto (dava para ver o vazio de cima), corda do macramé atravessando
  o cachepô.

Medição final: **1 vértice a 0,5 cm dentro de uma tábua em qualidade alta, zero
em baixa, e nenhum furo de parede nem no pior caso de vento.**

### Custo (medido, não estimado)

O gargalo apontado aqui na fase 1 — as peças de cerâmica, ~199 mil triângulos,
sem versão leve — **foi resolvido na fase 2**. As 19 peças da cena agora custam:

| | Nível `foco` (geometria antiga) | `alta` | `baixa` |
| --- | --- | --- | --- |
| Triângulos das 19 peças | 205.216 | **79.908** (−61%) | **44.436** (−78%) |
| Arranjo de rosas sozinho | 61.568 | 21.552 | 11.616 |

`foco` sobrou só para a peça em destaque, que é a única de que a câmera chega
perto o bastante para facetar. Desenhado por quadro depois da mudança: 287.372
triângulos em 295 chamadas no desktop, e 59.326 em 108 no celular.

**Remedido em 17/09** (visão geral, `renderer.info`, maior de 5 quadros), com o
gato, os quadros, os porta-retratos e as fotos do mural já na cena e o mapa de
sombra congelado depois de 45 quadros: **~172 mil triângulos em 220 chamadas**
em 1440 (alta) e **~73 mil em 167** em 375 (baixa). No celular as chamadas
passaram de 108 para 167 (a vista e o método da medida acima não ficaram
registrados, então a comparação é indicativa) — é o primeiro lugar a olhar se o
celular engasgar.

## 2. Fase 2: os quinze do topo, feitos

Um commit por item, cada um com a medição no corpo da mensagem. Em ordem:
plano B quando o 3D falha (carga sob demanda, limite de erro, contexto
perdido) · painel aberto vira endereço, com o voltar do navegador fechando o
painel · data do evento aceitando a data apertada, com prazo por tipo de peça ·
vista livre, com a volta à visão geral funcionando depois de arrastar · modo
lista podendo revisar e editar o pedido · erros do orçamento com foco,
`aria-*` e contraste · controle de foco (fundo inerte, foco que volta) ·
arrasto que não abre mais painel sem querer · etiqueta de preço pendurada sob a
tábua · contraste AA em nove pontos medidos · `touch-action` nas camadas da
cena · nível de detalhe das peças · qualidade pelo aparelho com recuo em
degraus · pedido mínimo visível no aviso, com desfazer.

**Decisão tomada com o dono:** o vermelho da marca ganhou um tom próprio para
texto, `--color-brasa-texto` #b3512a (4,52:1), com o menor desvio possível do
#c2582d — que continua em marcador, ícone e barra de progresso, onde 3:1 basta.

## 2b. Revisão do celular e da resiliência (16 e 17/09)

Laço de revisão com cada conserto medido antes e depois no navegador (CDP) e
conferido na produção. O relatório completo, com números e capturas, ficou fora
do repositório; aqui vai o mapa por tema (commit de referência entre parênteses).

- **Celular, tablet e telas estreitas**: área segura do iPhone (`899b735`,
  `fce0739`); cabeçalho de 768 a 960 numa linha (`2955546`, `f7368f6`); zoom de
  página do Android até 228 px CSS (`beb9429`, `b75c8e1`); títulos e linhas que
  quebram em vez de cortar (`142b614`); avisos que não cobrem cartão, folha nem
  gaveta (`e28c666`, `fe65780`, `7518326`).
- **Câmera e cena**: campo de visão por largura e com a gaveta aberta
  (`3c67ad1`, `cc45996`); etiquetas em janela baixa (`f839561`); giro pelo tipo de
  ponteiro (`2f06fc7`); marcadores sem colisão (`2789494`, `55ec943`); foto de
  perto com rótulo, casa e Esc (`237eb64`, `20792c0`).
- **Carregamento**: a cena monta numa transição e a lista responde durante o
  carregamento (`3954971`); aviso de demora na hora (`a08b97e`); cópia de
  primitiva sem montar a geometria padrão e sonda única de WebGL — A/B intercalado
  com CPU 4×: "Entrar" de 15,0 para 13,5 s de mediana (`d93a0e2`, `39a0815`);
  arquivos com hash em cache de um ano (`8491514`); CSS das fontes do Google sem
  bloquear a pintura (`c4204fd`).
- **Resiliência**: foto que falha não derruba o 3D (`9178233`); pacote do 3D que
  não baixa com retentativa real (`1d03a81`); estado guardado com tipo errado
  (`4c23aa4`); limites de erro no painel e na raiz (`4c23aa4`, `162cfbe`); página
  legível sem JavaScript (`d733858`, `854a7ef`); reserva com conteúdo quando o
  app não sobe (`8837e9c`); armazenamento cheio (`5e68107`); luz e sombras de volta
  depois de o contexto WebGL cair (`2a18e57`); página traduzida pelo navegador
  (`366aea5`, `7862f39`, nome fora da tradução em `f79da00`); aparelho só com
  WebGL1 vai para a lista (`56e2d3d`); pedido acompanha entre duas abas
  (`d1e1026`); página própria para endereço inexistente (`1e433fd`).
- **Desempenho contínuo**: com movimento reduzido a cena para de desenhar quando
  nada muda, e a pausa virou prop do Canvas (`fbd8b10`); passada do mouse refaz a
  sombra por 0,75 s em vez de 3,5 s (`fbd8b10`).
- **Acessibilidade**: h1 e main no ateliê (`c8eb9fb`); anel de foco nos campos
  (`3a7fe8e`); contraste do card do WhatsApp e do rótulo da câmera (`a711610`,
  `3eddc1d`); autocomplete do contato (`d40128e`); tour anunciado e com foco
  (`112eed3`); aviso com Desfazer que espera o foco e confirma (`816be76`,
  `456cc81`); foco que não se perde quando o controle some (`1a737fb`, `57df8f1`,
  `fd59f24`); cores forçadas com contorno e seleção visível (`b31f13a`); teclado
  do celular sem autocorreção no @ do Instagram (`b57cb32`); desfoque com prefixo
  para o Safari do iOS 16/17 (`c7678be`).
- **Pedido e orçamento**: mensagem com linhas em branco e rótulo do contato
  (`16744f8`, `b639650`); rascunho apagado tem desfazer (`23a4697`).
- **Documentação e dados**: README conferido com o código e lista com fotos
  (`3a593d5`); contagem do marcador derivada do catálogo (`bfc80de`).

Ficaram para decisão do dono, com medida: alvos de toque de 44 px, barra do
tour sobre os preços, celular deitado, texto colorido em caixa tingida (contraste
entre 3,4 e 4,45:1), borda dos campos (1,33:1), "a partir de R$ 12", modo escuro
forçado, voltar do Android na foto de perto, cena desenhando parada no celular
(movimento normal), navegadores suportados (iOS 16.4+ na prática), "Entrar" antes
das plantas — e as divergências de dados da seção 4.

## 3. Pendências

**Sem prova no meu ambiente — precisam de aparelho de verdade:**

- **Pinça sobre a UI** (`touch-action: pan-y` nas camadas): o toque sintético do
  CDP ignora `touch-action`. Forcei `none` na camada e a página ampliou do mesmo
  jeito, o que mostra que a ferramenta não passa pelo portão do Chrome. Pelo
  mesmo motivo, o "escala de 1 a 5" anotado no raio-x também não era prova de
  comportamento: o defeito se sustenta pela especificação.
- **PerfWatch sob carga**: não dá para forçar queda de fps honesta aqui. A
  lógica (descarte de quadro acima de 0,25 s, carência ao voltar de outro app,
  mediana em janelas de 2 s, recuo em degraus) está escrita e comentada, mas o
  comportamento em aparelho lento é pendência.

**Decisões e escopo:**

- **Nível "média" para tablet** (`P08`): ficou de fora. Tablet cai em "baixa"
  por ser aparelho de toque, que é o lado seguro. Um terceiro nível mexeria em
  planta, luz e sombra ao mesmo tempo.
- **Vazio à direita**: onde o retorno da parede termina, certos ângulos mostram
  o fundo escuro fora do cômodo.
- **Resto do raio-x**: os quinze eram o topo de 172 achados (1 de severidade 4,
  22 de severidade 3). O restante segue na lista.

## 4. Divergências de dados (não trocar sem confirmar)

Os dados daqui são fictícios; os fatos verificados estão no projeto pai
(`src/lib/site.ts`, `docs/01`, `docs/03`, `PERGUNTAS-PARA-A-ISABELA.md`).

| Dado | Aqui | Verificado / pendência |
| --- | --- | --- |
| Cidade | Foz do Iguaçu, PR (`studio.js:7`, textos de entrega e a descrição do `index.html`), trocada com confirmação em 16/09 | Foz do Iguaçu/PR (`site.ts`) — resolvido. O WhatsApp de exemplo segue com DDD 51 (linha abaixo) |
| WhatsApp | 5551999990000 (`studio.js:8`), em todo link `wa.me`; repetido à mão no `<noscript>` do `index.html`, junto com o e-mail e o prazo de resposta | Número real não definido. No pai, sem número o botão vira aviso |
| Instagram | @brasacubas | instagram.com/isabelacubas; o TikTok (@isabelacubas) não aparece aqui |
| E-mail | atelie@brasacubas.com.br | Não existe endereço definido; o botão "Por e-mail" depende dele |
| Nome da marca | "Brasa Cubas" | Pendente com a Isabela (§3 das perguntas) |
| Galeria "Projetos entregues" | 5 fotos de referência (`public/fotos/peca-*`, não são peças dela) com legendas genéricas, sem cliente, quantidade nem ano | O título "Projetos entregues" e a dica "O que já saiu daqui" ainda **afirmam entregas** que não são dela. Trocar pelas fotos reais ou mudar o título antes de publicar |
| Preços, prazos e pedido mínimo | 11 peças com preço de tabela, prazo 10–25 dias, mín. 20 lembrancinhas | Depende das respostas dela (§1, §2, §5, §7) |
| Pagamento | "50% + 50%" | O pai decidiu Pix na chave (D3) |
| Horário | Seg a sex, 9h às 18h | Não perguntado |
| Avisos obrigatórios (Decreto 7.962) | Ausentes: identificação do fornecedor, avisos por peça (`AVISOS_PECA` do pai), direito de arrependimento, frete discriminado | Precisam existir antes de publicar; a caneca e o ímã ainda não têm aviso escrito no pai |
| LGPD | Formulário coleta nome e contato, guarda em `localStorage`, sem política | Definir política e se o rascunho continua salvo |
| Contagens fixas | "cinco pontos", "três telas" (o "11 peças com preço" do marcador passou a contar o catálogo em 17/09) | Passam a depender do catálogo real |
| Pedido mínimo no FAQ | "Só para lembrancinhas, que saem a partir de 20 unidades" (`studio.js`, `faq`) | **O site se contradiz**: o Ímã Florzinha também é lembrancinha e tem mínimo de 10 (`products.js`). Corrigir o texto ou o dado quando vierem as regras dela |
| Prazo escrito à mão | "a partir de 10 dias" no passo a passo e no FAQ (`studio.js`) | Hoje bate com `minLeadDays` e com o menor `leadDays` do catálogo, mas é número digitado: trocar o prazo real sem trocar esses dois textos abre contradição |
| Domínio / canonical / og:image | `brasacubas.com.br` comentado, sem og:image | Domínio não definido (§11) |

## 5. Como retomar

```bash
npm run build
npx vite preview --port 4399 --strictPort
```

Cuidados que valem para quem for testar:

1. A porta **5173 é de outro projeto** nesta máquina. Usar porta explícita.
2. Aba em segundo plano congela `requestAnimationFrame`: antes de concluir que
   "não anima", conferir `document.visibilityState`.
3. Em dev, depois de um HMR o Vite serve o módulo com `?t=...`. Um script de
   teste que importe `/src/store/useStore.js` sem essa query pega **outra
   instância** do store, e nada do que ele mandar chega no app.
4. **Cor com opacidade no Tailwind v4 volta como `oklab(...)`.** Ler os três
   números de `getComputedStyle` como se fossem R, G e B dá preto, e a conta de
   contraste sai errada — foi assim que uma primeira medição me enganou. Pintar
   a cor num canvas de 1×1 e ler o pixel resolve oklab, alfa e composição de uma
   vez, com o próprio navegador fazendo a conversão.
5. **O toque sintético do CDP ignora `touch-action`.** Teste de pinça naquele
   caminho não prova nada; confirmei forçando `touch-action: none` e vendo a
   página ampliar assim mesmo.
6. `touch-action` **não é herdado**: ler o valor da folha responde "auto" mesmo
   com o pai restringindo. O navegador cruza a cadeia de ancestrais no momento
   do gesto — é a cadeia que precisa ser lida.
