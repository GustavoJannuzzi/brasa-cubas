# Status — 15/09/2026

A rodada de melhorias foi **terminada e verificada na tela**. O que esta página
guarda agora: o que mudou, o que foi medido, o que ficou pendente de decisão do
dono e as divergências entre os dados fictícios daqui e os fatos já verificados
da Isabela (no projeto pai).

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

| | Desktop 1440×900, alta | Celular 375×812, baixa |
| --- | --- | --- |
| Triângulos visíveis | ~302 mil | ~227 mil |
| Por quadro | ~593 mil (sombra redesenha quase tudo) | ~227 mil (sem sombra) |
| Draw calls | ~377 | ~130 |
| fps (GPU Intel UHD, máquina ocupada) | 21–24 | 29–40 |

As plantas são ~76 mil triângulos em alta (a estimativa antiga dizia 60 mil). O
gargalo, porém, são **as peças de cerâmica: ~199 mil triângulos**, e o arranjo de
rosas sozinho tem 59 mil. As peças não têm versão leve, como as plantas têm.

## 2. Pendências de decisão

- **Desempenho**: congelar o mapa de sombra numa cena quase parada, dar versão
  leve às peças e ver o `PerfWatch` (ele disparou "a cena está pesada" num
  desktop com Intel UHD). Nada disso foi aplicado.
- **Vazio à direita**: onde o retorno da parede termina, certos ângulos mostram
  o fundo escuro fora do cômodo.
- **Raio-x de UX (fase 2)**: auditoria feita com as skills e os fluxos
  percorridos no navegador (desktop e celular). A lista priorizada, com prints,
  vai separada — nada dela foi implementado.

## 3. Divergências de dados (não trocar sem confirmar)

Os dados daqui são fictícios; os fatos verificados estão no projeto pai
(`src/lib/site.ts`, `docs/01`, `docs/03`, `PERGUNTAS-PARA-A-ISABELA.md`).

| Dado | Aqui | Verificado / pendência |
| --- | --- | --- |
| Cidade | Porto Alegre, RS (`studio.js:7`, `index.html`, textos) | Foz do Iguaçu/PR (`site.ts`) |
| WhatsApp | 5551999990000 (`studio.js:8`), em todo link `wa.me` | Número real não definido. No pai, sem número o botão vira aviso |
| Instagram | @brasacubas | instagram.com/isabelacubas; o TikTok (@isabelacubas) não aparece aqui |
| E-mail | atelie@brasacubas.com.br | Não existe endereço definido; o botão "Por e-mail" depende dele |
| Nome da marca | "Brasa Cubas" | Pendente com a Isabela (§3 das perguntas) |
| Galeria "Projetos entregues" | 6 projetos com cliente, quantidade e ano | Nenhum confirmado. Hoje o site **afirma entregas** que ninguém verificou |
| Preços, prazos e pedido mínimo | 11 peças com preço de tabela, prazo 10–25 dias, mín. 20 lembrancinhas | Depende das respostas dela (§1, §2, §5, §7) |
| Pagamento | "50% + 50%" | O pai decidiu Pix na chave (D3) |
| Horário | Seg a sex, 9h às 18h | Não perguntado |
| Avisos obrigatórios (Decreto 7.962) | Ausentes: identificação do fornecedor, avisos por peça (`AVISOS_PECA` do pai), direito de arrependimento, frete discriminado | Precisam existir antes de publicar; a caneca e o ímã ainda não têm aviso escrito no pai |
| LGPD | Formulário coleta nome e contato, guarda em `localStorage`, sem política | Definir política e se o rascunho continua salvo |
| Contagens fixas | "11 peças com preço", "cinco pontos", "três telas" | Passam a depender do catálogo real |
| Domínio / canonical / og:image | `brasacubas.com.br` comentado, sem og:image | Domínio não definido (§11) |

## 4. Como retomar

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
