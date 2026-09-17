# Brasa Cubas — ateliê de porcelana fria em 3D

Protótipo de vitrine navegável em 3D para um ateliê de porcelana fria (biscuit):
o visitante entra no ateliê, olha a bancada, vê as peças na prateleira com preço,
monta um pedido e manda um orçamento.

Referência de conceito: [john-and-patricias-romantic-comfort-website](https://github.com/andrewwoan/john-and-patricias-romantic-comfort-website).
A diferença de fundo é que aqui o site precisa **vender** — por isso a navegação
não depende de explorar a cena (ver "Orientação" abaixo).

```bash
npm install
npm run dev      # sobe com --host; use porta explícita se a 5173 estiver ocupada
npm run build
npm run preview
```

---

## Decisões que valem saber

**Cena 100% procedural, sem Blender nem GLTF.** Cada peça é gerada por código em
`src/three/pieceGeometry.js` a partir de primitivas e perfis de revolução
(`LatheGeometry`); as plantas, em `src/three/plantGeometry.js`. As texturas —
assoalho, reboco, cortiça, tapete de corte, placa do ateliê, vidro da janela —
são desenhadas em `<canvas>` em `src/three/textures.js`. Resultado: **nenhum
modelo 3D no repositório**. As únicas imagens são as fotos do mural e dos
quadros (`public/fotos/`): carregam por `Suspense` sem segurar o resto da cena, e
uma foto que falhe some sozinha em vez de derrubar o 3D (`FotoOpcional`).

**Uma geometria por material, não por objeto.** Cada peça produz até cinco
grupos (massa, pintura, pétala, folha, miolo da flor) que são mesclados com
`mergeGeometries`. Uma rosa tem 14 pétalas; sem a mescla, o arranjo de 12 rosas
seriam ~170 draw calls. Com a mescla, 5. As plantas seguem a mesma regra: cinco
materiais compartilhados (folha, haste, vaso, terra, corda) para as 15 plantas.

**O cômodo é feito de caixas, não de planos.** Parede tem espessura, então a
quina da abertura aparece, o rodapé tem onde encostar e a janela é um **vão de
verdade** — a parede do fundo é montada em quatro painéis em volta dele. O sol
entra por esse vão e a cruz clara na bancada é a sombra do caixilho, projetada:
não há mancha de luz pintada em lugar nenhum (`src/three/Atelier.jsx`,
`src/three/Lighting.jsx`).

**Plantas em quatro lugares, como na vida real** — chão, parede, prateleira e
penduradas na viga. São 7 espécies procedurais (costela-de-adão, espada,
samambaia, jiboia, suculenta, cacto, hera): a folha é malha paramétrica (afina
na base e na ponta, faz calha, cai pelo peso, torce) e a haste é tubo sobre
curva Catmull-Rom. O vento mora no vertex shader, com peso por vértice
(distância até o vaso), então o caule fica firme e a ponta da folha é que anda.
As posições ficam em `plants`, em `src/data/scene.js`, com duas regras escritas
no comentário: folhagem não fura parede e nada pendurado no corredor entre a
câmera da vista `prateleira` e a estante.

**Escala exagerada de propósito.** As peças reais têm de 5 a 20 cm. Nessa escala
elas viravam pontinhos na prateleira, então são expostas em `PIECE_SCALE`
(`src/data/scene.js`). O ambiente, ao contrário, é em escala de verdade — é ele
que dá a referência de tamanho.

**Medidas num só lugar.** `src/data/scene.js` guarda a geometria do ambiente, as
vagas da prateleira, as plantas, os limites da câmera, os presets de vista e os
pontos interativos. Mexer na altura de um nível da prateleira move a peça, a
etiqueta, o ponto e a câmera juntos.

**A câmera não sai do diorama.** `src/three/CameraRig.jsx` prende o ALVO numa
caixa (`orbit.targetBounds`, que contém todos os presets) e a CÂMERA por dois
caminhos: as paredes entram como `colliderMeshes` — quando o giro a levaria para
trás de uma delas, ela se aproxima do alvo em vez de atravessar — e a altura é
limitada a cada quadro entre `cameraMinY` e `cameraMaxY`, calculada a partir da
distância e do alvo de destino. Sem isso, meia tela de arrasto parava a câmera
atrás da parede direita, e um arrasto vertical a levava a 6 m de altura, acima
do teto, que é um plano de uma face só.

**Sem passe de postprocessing.** Bloom/DoF custam caro em celular. O clima
quente vem da iluminação, de um `Environment` gerado na hora (sem baixar HDRI) e
de uma vinheta em CSS por cima do canvas.

---

## Orientação: o problema central deste tipo de site

Um site 3D bonito costuma esconder a informação comercial. Aqui o caminho para
"o que é isso, quais peças existem e onde eu compro" nunca depende de descobrir
a cena:

| Recurso | Onde |
| --- | --- |
| Menu sempre visível (topo no desktop, barra inferior no celular) | `src/ui/Header.jsx` |
| Cartão de boas-vindas com proposta + "Ver produtos" / "Pedir orçamento" | `HeroCard` em `src/ui/Overlays.jsx` |
| Chip dizendo onde a câmera está + volta para a visão geral | `OrientationBar` |
| Pontos da cena com rótulo **e** dica escritos, não só um brilho | `src/three/Hotspot.jsx` |
| Etiquetas de preço na própria prateleira (desktop) | `Etiqueta` em `src/three/Shelf.jsx`, estilo `.etiqueta-peca` em `src/index.css` |
| Tour guiado pelos cinco pontos | `TourBar`, oferecido na apresentação e no painel de ajuda |
| Apresentação de 3 telas na primeira visita | `Onboarding` em `src/ui/Intro.jsx` |
| Placa com o nome do ateliê dentro da cena | `Atelier.jsx` + `signTexture()` |
| **Modo simples**: o mesmo conteúdo como página que rola, sem 3D | `src/ui/SimpleMode.jsx` |
| Conteúdo semântico para buscadores e para quem está sem JS | `<noscript>` em `index.html` |

O modo simples não é um plano B escondido: está no carregamento ("ou ver o
catálogo como lista"), no menu e é **sugerido automaticamente** quando a mediana
do quadro passa de 50 ms (20 fps) de forma persistente (`PerfWatch` em
`src/three/Experience.jsx`). O recuo é em dois degraus: primeiro só baixa o
`dpr`; se não bastar, cai para a qualidade baixa e oferece a lista. O
rebaixamento vale para as visitas seguintes por 7 dias (`src/lib/tier.js`). No
modo simples o canvas nem é montado, e quem entra direto nele não baixa o pacote
do 3D (`src/three/experienceLazy.js`).

---

## Mobile

Não é o layout de desktop encolhido:

- **Enquadramento próprio por vista** (`views[x].mobile`). Em retrato o campo
  horizontal é menor, e só afastar a câmera jogaria a cena para longe. A vista
  da prateleira em retrato é enquadrada pela LARGURA: a distância é a que faz as
  cinco colunas de peça caberem na tela.
- **Bottom sheet arrastável** para fechar, em vez de gaveta lateral (`Panel.jsx`).
- **Barra inferior com rótulos escritos**, em vez de menu atrás de um hambúrguer.
- **"Ver detalhes" e "Ver na prateleira" são ações diferentes.** No celular o
  painel cobre 84% da tela, então mover a câmera atrás dele não serve de nada:
  "ver na prateleira" fecha o painel, destaca a peça no 3D e mostra nome, preço
  e "Adicionar" numa faixa baixa (`FocusedProductBar`).
- **Hitbox ampliada** (1,6× o diâmetro da peça) para peças pequenas serem
  acertáveis com o dedo.
- **Qualidade decidida pelo aparelho, não pela largura** (`src/lib/tier.js`):
  toque grosso, até 4 núcleos, até 2 GB ou renderizador por software caem na
  `baixa` — sem sombra nem antialias, `dpr` até 1,25, menos partículas e plantas
  com menos folhas. Girar o celular muda o enquadramento, nunca a qualidade.
- `prefers-reduced-motion` desliga as transições de câmera e o respiro.

---

## Fluxos funcionais

- **Catálogo** com filtro por categoria, preço, prazo, tamanho e pedido mínimo.
- **Pedido** com quantidade, subtotal, aviso de estimativa quando a peça é
  "a partir de", e fechamento por WhatsApp com a mensagem já escrita.
- **Orçamento** em 3 passos (o que / para quando / como te encontro), com
  validação, aviso quando a data do evento é mais curta que o prazo de produção,
  e três saídas: WhatsApp, e-mail ou copiar o texto.
- Carrinho e rascunho do orçamento **sobrevivem a uma recarga** (`persist` do
  zustand, em `localStorage`; com o armazenamento bloqueado o site funciona, só
  não lembra).
- **Links diretos** para painel e peça (`#orcamento`, `#produto/caneca-floral`),
  e o voltar do navegador fecha o painel em vez de sair do site
  (`src/hooks/useRotaHash.js`).

Nada é cobrado pelo site — por escolha de modelo, o pedido vira conversa.
Não há gateway de pagamento.

---

## Estrutura

```
src/
  data/       products.js (catálogo + galeria), studio.js (negócio),
              scene.js (medidas, plantas, limites e presets de câmera)
  store/      useStore.js — estado único (câmera, painéis, carrinho, orçamento)
  three/      pieceGeometry.js (gerador de peças), plantGeometry.js (plantas),
              shapes.js (caixa e cilindro arredondados, cacheados),
              textures.js (canvas), lente.js (campo de visão e gaveta),
              experienceLazy.js (o 3D em pacote próprio), Atelier, WorkTable,
              Shelf, Pinboard, Quadros, Plants, Cat, CeramicPiece, Hotspot,
              Lighting, CameraRig, FotoOpcional, Experience
  ui/         Header (com o MobileNav), Panel, Intro, Overlays, SimpleMode,
              Aviso3D, Boundary3D, Icons, PieceThumb
  ui/panels/  Products, ProductDetail, Quote, Cart, Gallery, Process, Contact, Help
  hooks/      useMedia.js, useRotaHash.js (hash e voltar do navegador),
              useCliqueSemArrasto.js
  lib/        format.js (BRL, datas), prazo.js, rotas.js, tier.js (qualidade
              por aparelho), webgl.js, whatsapp.js (mensagens)
```

---

## Custo da cena (medido)

Medido em 17/09 na visão geral, pelo `renderer.info` (maior de 5 quadros
seguidos), GPU integrada Intel UHD:

| | 1440×900, alta, com sombra | 375×812, baixa, sem sombra |
| --- | --- | --- |
| Draw calls por quadro | 220 | 167 |
| Triângulos por quadro | ~172 mil | ~73 mil |
| Triângulos em malhas visíveis (sem recorte da câmera) | ~184 mil | ~110 mil |
| Texturas / programas | 32 / 21 | 30 / 20 |

O mapa de sombra **congela** depois de 45 quadros (`Sombra` em
`Experience.jsx`), então o quadro comum não repassa a cena para a sombra; quem
move algo que projeta sombra pede um `needsUpdate` (ver `CeramicPiece`).
Números de 15/09, antes disso e das otimizações seguintes: ~593 mil triângulos e
~377 draw calls por quadro no desktop.

---

## Deploy

O projeto é um site estático (Vite): `npm run build` gera `dist/`, sem variável
de ambiente para configurar — o pedido sai por link do WhatsApp, sem backend.
Não existe `vercel.json` de propósito: é uma página só, sem rotas de cliente. Se
algum dia entrar um router, aí sim vale `{ "rewrites": [{ "source": "/(.*)",
"destination": "/" }] }`.

A versão do Node está fixada em `engines` (>= 20.19), porque o Vite 8 não roda
nas anteriores.

**Atenção ao plano:** o Hobby da Vercel proíbe uso comercial, e este site é de
um ateliê que vende. Para publicar, escolher um plano/host que permita
(Netlify e Cloudflare Pages têm plano gratuito sem essa restrição).

**Quando houver domínio próprio:** descomentar o `<link rel="canonical">` no
`index.html` com a URL real e acrescentar uma `og:image` — hoje o link
compartilhado aparece sem imagem de prévia.

---

## O que é placeholder e precisa dos dados reais

1. **`src/data/studio.js`** — WhatsApp, e-mail, Instagram, horário, prazos e
   condições de pagamento são fictícios (a cidade, Foz do Iguaçu, já é a real).
   O `<noscript>` do `index.html` **repete** WhatsApp, e-mail e o prazo de
   resposta: trocar lá também.
2. **`src/data/products.js`** — os 11 produtos, preços, prazos e textos são
   inventados para o teste. As cores em `piece` controlam como a peça aparece
   em 3D e na miniatura.
3. **Fotos** (`public/fotos/`) — `peca-01` a `peca-05` ilustram os "projetos
   entregues" (mural 3D e painel de Projetos) e **não são trabalho da Isabela**:
   são imagens de referência, e as legendas de `gallery` em `products.js`
   descrevem essas imagens, não peças dela. `retrato-*` são fotos pessoais dela,
   nos quadros da parede e nos porta-retratos. Para trocar, basta substituir o
   arquivo mantendo o nome, ou mudar `foto` em `gallery` (`products.js`) e em
   `quadros` / `retratos` (`scene.js`).
4. **Fontes** — Fraunces e Inter vêm do Google Fonts. Para não depender de
   rede, baixar e servir de `public/`.

Os dados verificados da Isabela (cidade, redes, avisos obrigatórios por peça)
estão no projeto pai, em `src/lib/site.ts` e `docs/`. A lista de divergências
entre o que está aqui e o que já se sabe está em `STATUS.md`.

## Próximos passos naturais

- Trocar as silhuetas por fotos reais das peças (é o que mais aumenta conversão
  num ateliê artesanal).
- Versão leve das peças para o celular, como já existe para as plantas.
- Som ambiente com botão de desligar (a referência usa `howler`).
- Backend para o orçamento cair num painel, em vez de sair por WhatsApp.
