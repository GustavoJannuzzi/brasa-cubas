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
arquivo de imagem ou modelo no repositório** e nada para baixar antes da cena
aparecer.

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
catálogo como lista"), no menu e é **sugerido automaticamente** quando o quadro
cai abaixo de ~20 fps (`PerfWatch` em `src/three/Experience.jsx`). No modo
simples o canvas nem é montado.

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
- **Hitbox ampliada** (~3× o tamanho da peça) para peças pequenas serem
  acertáveis com o dedo.
- Sombras e antialias desligados, `dpr` limitado, menos partículas e plantas com
  menos folhas (qualidade `baixa` em `Experience.jsx`).
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
  zustand, em `localStorage`).

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
              textures.js (canvas), Atelier, WorkTable, Shelf, Pinboard,
              Plants, Hotspot, Lighting, CameraRig, Experience
  ui/         Header, Panel, Intro, Overlays, SimpleMode, Icons, PieceThumb
  ui/panels/  Products, ProductDetail, Quote, Cart, Gallery, Process, Contact, Help
  hooks/      useMedia.js
  lib/        format.js (BRL, datas), whatsapp.js (mensagens)
```

---

## Custo da cena (medido)

Desktop 1440×900, dpr 1, qualidade alta, GPU integrada Intel UHD:

| | |
| --- | --- |
| Triângulos visíveis | ~302 mil |
| Triângulos por quadro | ~593 mil (o mapa de sombra redesenha quase tudo) |
| Draw calls | ~377 |
| Peças de cerâmica | ~199 mil triângulos (o arranjo de rosas sozinho tem 59 mil) |
| Plantas | ~76 mil em alta, ~37 mil em baixa |

Em retrato (375×812, qualidade baixa, sem sombra) a mesma cena fica em ~227 mil
triângulos e ~130 draw calls. **O gargalo são as peças, não as plantas**: elas
não têm versão leve, e é por aí que começa qualquer otimização de celular.

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

1. **`src/data/studio.js`** — WhatsApp, e-mail, Instagram, cidade, horário,
   prazos e condições de pagamento são fictícios.
2. **`src/data/products.js`** — os 11 produtos, preços, prazos e textos são
   inventados para o teste. As cores em `piece` controlam como a peça aparece
   em 3D e na miniatura.
3. **Galeria** — os "projetos entregues" usam retângulos em degradê com o selo
   "foto em breve". Para usar fotos de verdade: colocar em `public/galeria/` e
   trocar o `<div>` do gradiente por `<img>` em `GalleryPanel.jsx` e
   `SimpleMode.jsx`; no mural 3D (`Pinboard.jsx`), trocar o
   `meshStandardMaterial color` por `map={useTexture(...)}`.
4. **Fontes** — Fraunces e Inter vêm do Google Fonts. Para não depender de
   rede, baixar e servir de `public/`.

Os dados verificados da Isabela (cidade, redes, avisos obrigatórios por peça)
estão no projeto pai, em `src/lib/site.ts` e `docs/`. A lista de divergências
entre o que está aqui e o que já se sabe está em `STATUS.md`.

## Próximos passos naturais

- Trocar as silhuetas por fotos reais das peças (é o que mais aumenta conversão
  num ateliê artesanal).
- `React.lazy` no `Experience` para quem entra em modo simples não baixar o
  three.js (hoje o bundle é ~1,34 MB / 371 kB gzip, quase tudo three + drei).
- Versão leve das peças para o celular, como já existe para as plantas.
- Som ambiente com botão de desligar (a referência usa `howler`).
- Backend para o orçamento cair num painel, em vez de sair por WhatsApp.
