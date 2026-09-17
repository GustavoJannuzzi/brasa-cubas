import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { productById } from '../data/products'
import { hotspots, panelToHotspot } from '../data/scene'
import { money } from '../lib/format'

let toastSeq = 0
// Temporizadores dos avisos, fora do estado: pausar e retomar nao precisa
// redesenhar nada.
const tempoDosAvisos = new Map()

// Trocar entre lista e ateliê troca a pagina inteira com o foco dentro do botao
// que pediu a troca: medido, o foco caia no body. Depois do commit, e so se o
// foco se perdeu: vai para o titulo da lista ou para a marca do ateliê.
const focarDepoisDeTrocarModo = (simples) =>
  requestAnimationFrame(() => {
    const ativo = document.activeElement
    if (ativo && ativo !== document.body && document.contains(ativo)) return
    document.querySelector(simples ? 'main h1' : 'header button')?.focus({ preventScroll: true })
  })

// Gravar pode falhar mesmo com o localStorage acessivel: cota cheia
// (QuotaExceededError), navegador que zera a cota. O zustand grava dentro de cada
// `set`, sem protecao, e a excecao subia ate o React — medido com `setItem`
// lancando: o app inteiro caia em "Algo deu errado" no primeiro toque, e
// recarregar nao resolvia. Sem gravar o site segue; so nao lembra do pedido na
// proxima visita. O localStorage e lido JA na criacao: bloqueado de vez (getter
// lancando), o `createJSONStorage` segue devolvendo nada e o persist se desliga,
// como antes.
const armazenamento = createJSONStorage(() => {
  const local = window.localStorage
  return {
    getItem: (nome) => local.getItem(nome),
    setItem: (nome, valor) => {
      try {
        local.setItem(nome, valor)
      } catch {
        /* sem espaco: segue sem guardar */
      }
    },
    removeItem: (nome) => {
      try {
        local.removeItem(nome)
      } catch {
        /* idem */
      }
    },
  }
})

// Linhas do pedido lidas do armazenamento, sem o que nao vale mais (peca fora do
// catalogo, quantidade de tipo errado). Usado na hidratacao e na outra aba.
const pedidoGuardado = (guardado) =>
  (Array.isArray(guardado?.cart) ? guardado.cart : [])
    .filter((line) => line && productById(line.id) && Number(line.qty) > 0)
    .map((line) => ({ ...line, qty: Math.max(productById(line.id).minQty, Math.round(Number(line.qty))) }))

export const useStore = create(
  persist(
    (set, get) => ({
      // --- carregamento e entrada ---
      assetsReady: false,
      entered: false,
      setAssetsReady: (assetsReady) => set({ assetsReady }),
      enter: () => set({ entered: true }),

      // --- camera ---
      view: 'home',
      // Produto em foco na cena (peca destacada na prateleira).
      focusedProduct: null,
      // Quadro que a camera foi ver de perto. Mesma ideia de `focusedProduct`,
      // e por isso entra pelo mesmo caminho no CameraRig: o retorno da revisao
      // foi que as fotos na parede sao pequenas demais no celular para se saber
      // quem esta nelas.
      quadroFocado: null,
      // Rotulo de onde a camera esta, escrito pela variante de navegacao em
      // teste (?nav=). Fora do prototipo fica null e nada muda.
      lugarProto: null,
      setLugarProto: (lugarProto) => set({ lugarProto }),
      // Conta quantas vezes alguem PEDIU um enquadramento. Pedir 'home' estando
      // em 'home' nao muda `view`, entao o efeito do CameraRig nao rodava: quem
      // se perdia arrastando apertava voltar e nada acontecia.
      cameraSeq: 0,
      // Verdadeiro depois que a pessoa mexeu na camera por conta propria: o
      // rotulo nao pode seguir afirmando que ela esta na visao geral.
      vistaLivre: false,
      setVistaLivre: (vistaLivre) => set((s) => (s.vistaLivre === vistaLivre ? s : { vistaLivre })),
      goTo: (view) => set((s) => ({ view, focusedProduct: null, quadroFocado: null, cameraSeq: s.cameraSeq + 1 })),

      // --- paineis ---
      // null | produtos | produto | orcamento | galeria | processo | contato | carrinho | ajuda
      panel: null,
      selectedProduct: null,

      openPanel: (panel) => {
        const spot = panelToHotspot[panel]
        set((s) => ({
          panel,
          view: spot ? spot.view : s.view,
          // Painel com lugar na cena leva a camera ate la. A foto em close tem
          // prioridade no CameraRig, e sem limpar aqui a camera ficava na foto
          // com o rotulo dizendo "O telefone do ateliê" (medido abrindo Contato
          // com um quadro em close, antes e depois de fechar o painel).
          quadroFocado: spot ? null : s.quadroFocado,
          cameraSeq: spot ? s.cameraSeq + 1 : s.cameraSeq,
        }))
        if (spot) get().discover(spot.id)
      },

      closePanel: () => set({ panel: null, selectedProduct: null }),

      // Abre o detalhe do produto e, opcionalmente, aponta a camera para a peca.
      // No celular o painel ocupa quase a tela inteira, entao quem chama passa
      // focus: false — mover a camera atras de uma folha opaca nao serve de nada.
      openProduct: (id, { focus = true } = {}) =>
        set((s) => ({
          panel: 'produto',
          selectedProduct: id,
          focusedProduct: focus ? id : null,
          view: focus ? 'prateleira' : s.view,
          cameraSeq: focus ? s.cameraSeq + 1 : s.cameraSeq,
        })),

      // Fecha o painel e destaca a peca na prateleira. E a acao
      // "ver na prateleira": aqui o 3D e o conteudo, nao a decoracao.
      focusProductIn3D: (id) =>
        set((s) => ({
          focusedProduct: id,
          selectedProduct: id,
          view: 'prateleira',
          panel: null,
          cameraSeq: s.cameraSeq + 1,
        })),

      focarQuadro: (id) => set({ quadroFocado: id, panel: null, focusedProduct: null }),
      clearFocus: () => set({ focusedProduct: null, selectedProduct: null, quadroFocado: null }),

      backToProducts: () => set({ panel: 'produtos', selectedProduct: null, focusedProduct: null }),

      // --- hotspots: descoberta e visibilidade ---
      discovered: [],
      showHotspots: true,
      discover: (id) =>
        set((s) => (s.discovered.includes(id) ? s : { discovered: [...s.discovered, id] })),
      toggleHotspots: () => set((s) => ({ showHotspots: !s.showHotspots })),

      // --- tour guiado ---
      tourStep: -1,
      startTour: () => {
        const first = hotspots[0]
        set((s) => ({ tourStep: 0, panel: null, view: first.view, cameraSeq: s.cameraSeq + 1 }))
        get().discover(first.id)
      },
      nextTourStep: () => {
        const next = get().tourStep + 1
        if (next >= hotspots.length) {
          set((s) => ({ tourStep: -1, view: 'home', cameraSeq: s.cameraSeq + 1 }))
          return
        }
        const spot = hotspots[next]
        set((s) => ({ tourStep: next, view: spot.view, cameraSeq: s.cameraSeq + 1 }))
        get().discover(spot.id)
      },
      stopTour: () => set({ tourStep: -1 }),

      // --- carrinho ---
      cart: [],
      addToCart: (id, qty) => {
        const product = productById(id)
        if (!product) return
        const amount = Math.max(qty ?? product.minQty, product.minQty)
        let total = amount
        let jaEstava = false
        set((s) => {
          const existing = s.cart.find((line) => line.id === id)
          jaEstava = Boolean(existing)
          total = existing ? existing.qty + amount : amount
          return {
            cart: existing
              ? s.cart.map((line) => (line.id === id ? { ...line, qty: total } : line))
              : [...s.cart, { id, qty: amount }],
          }
        })

        // A regra tem de aparecer no proprio aviso. A lembrancinha anuncia
        // "a partir de R$ 12" e um toque em Adicionar poe 20 unidades e
        // R$ 240 — quem nao ve a conta so descobre no carrinho, e a confianca
        // quebra justamente ali. Um segundo toque leva a 40 e R$ 480.
        // "a partir de" tem de aparecer tambem aqui: anunciar R$ 480 fechado
        // para peca cujo valor depende da personalizacao e promessa que o
        // orcamento nao vai cumprir.
        const bruto = money(product.price * total)
        const valor = product.from ? `a partir de ${bruto}` : bruto
        // So e "minimo do pedido" quando a quantidade FOI o minimo. Quem
        // escolheu 40 no detalhe nao esta vendo um minimo.
        const ehMinimo = !jaEstava && product.minQty > 1 && total === product.minQty

        get().toast(
          jaEstava
            ? `${product.name}: agora são ${total} ${product.unit} · ${valor}`
            : ehMinimo
              ? `${product.name}: ${total} ${product.unit} (mínimo do pedido) · ${valor}`
              : `${product.name}: ${total} ${product.unit} · ${valor}`,
          { chave: `carrinho:${id}` },
        )
      },
      setQty: (id, qty) => {
        const product = productById(id)
        const min = product?.minQty ?? 1
        set((s) => ({
          cart: s.cart.map((line) => (line.id === id ? { ...line, qty: Math.max(min, qty) } : line)),
        }))
      },
      // Remover e limpar sao destrutivos e ficam a um toque de "Continuar
      // escolhendo": guardam o que saiu e oferecem a volta.
      //
      // O desfazer e OPERACAO INVERSA sobre o carrinho atual, nao restauracao
      // de um retrato. Guardando o array inteiro, o aviso vive 6 s e qualquer
      // coisa que a pessoa mexesse nesse meio-tempo — somar uma peca, mudar
      // quantidade — era apagada em silencio ao desfazer.
      removeFromCart: (id) => {
        const anterior = get().cart
        const indice = anterior.findIndex((line) => line.id === id)
        if (indice < 0) return
        const linha = anterior[indice]
        const product = productById(id)

        set({ cart: anterior.filter((line) => line.id !== id) })
        get().toast(`${product?.name ?? 'Peça'} saiu do pedido`, {
          chave: 'carrinho:desfazer',
          acao: {
            rotulo: 'Desfazer',
            aoClicar: () => {
              set((s) => {
                // Se a peca voltou por outro caminho, nao duplicar.
                if (s.cart.some((l) => l.id === id)) return s
                const volta = [...s.cart]
                volta.splice(Math.min(indice, volta.length), 0, linha)
                return { cart: volta }
              })
              // Troca o aviso (mesma chave): antes ele seguia dizendo "saiu do
              // pedido · Desfazer" com a peca ja de volta, e o leitor de tela nao
              // ouvia confirmacao nenhuma.
              get().toast(`${product?.name ?? 'Peça'} voltou ao pedido`, { chave: 'carrinho:desfazer' })
            },
          },
        })
      },
      clearCart: () => {
        const anterior = get().cart
        if (!anterior.length) return
        set({ cart: [] })
        get().toast('Pedido limpo', {
          chave: 'carrinho:desfazer',
          acao: {
            rotulo: 'Desfazer',
            aoClicar: () => {
              set((s) => {
                // Mescla: o que entrou depois de limpar continua, e com a
                // quantidade que a pessoa escolheu agora.
                const porId = new Map(s.cart.map((l) => [l.id, l]))
                for (const l of anterior) if (!porId.has(l.id)) porId.set(l.id, l)
                return { cart: [...porId.values()] }
              })
              get().toast('Pedido de volta', { chave: 'carrinho:desfazer' })
            },
          },
        })
      },

      // --- rascunho do orcamento (sobrevive a recarga da pagina) ---
      quote: {
        kind: '',
        qty: '',
        eventDate: '',
        colors: '',
        details: '',
        name: '',
        contact: '',
        contactKind: 'whatsapp',
      },
      setQuoteField: (field, value) => set((s) => ({ quote: { ...s.quote, [field]: value } })),
      // Apagar o rascunho tem volta, como remover e limpar o pedido. "Comecar do
      // zero" e um link pequeno ao lado do aviso de rascunho: medido, um toque
      // apagava tudo — ate a descricao longa da ideia — sem aviso nem desfazer.
      resetQuote: () => {
        const anterior = get().quote
        set({
          quote: {
            kind: '',
            qty: '',
            eventDate: '',
            colors: '',
            details: '',
            name: '',
            contact: '',
            contactKind: 'whatsapp',
          },
        })
        const tinhaTexto = ['kind', 'qty', 'eventDate', 'colors', 'details', 'name', 'contact'].some((campo) =>
          String(anterior[campo] ?? '').trim(),
        )
        if (!tinhaTexto) return
        get().toast('Rascunho apagado', {
          chave: 'orcamento:desfazer',
          acao: {
            rotulo: 'Desfazer',
            aoClicar: () => {
              set({ quote: anterior })
              get().toast('Rascunho de volta', { chave: 'orcamento:desfazer' })
            },
          },
        })
      },

      // --- preferencias / desempenho ---
      simpleMode: false,
      setSimpleMode: (simpleMode) => {
        set({ simpleMode })
        focarDepoisDeTrocarModo(simpleMode)
      },
      toggleSimpleMode: () => {
        const simples = !get().simpleMode
        set({ simpleMode: simples })
        focarDepoisDeTrocarModo(simples)
      },
      // Estado do 3D. 'ok' enquanto desenha; 'perdido' quando o contexto WebGL
      // cai (o WKWebView derruba ao voltar de outro app) ou a cena lanca
      // excecao; 'indisponivel' quando o aparelho nem abre WebGL; 'naoBaixou'
      // quando o pacote do 3D falhou no download (rede) — ai so recarregar
      // resolve. Quem marca e o App (na sonda e no limite de erro) e o Experience
      // (nos eventos do canvas).
      gl3d: 'ok',
      setGl3d: (gl3d) => set({ gl3d }),

      // Sugerido automaticamente quando o quadro cai abaixo de ~20fps.
      perfWarned: false,
      lowPerf: false,
      reportLowPerf: () => {
        if (get().perfWarned || get().simpleMode) return
        set({ lowPerf: true, perfWarned: true })
      },
      dismissLowPerf: () => set({ lowPerf: false }),

      onboardingDone: false,
      finishOnboarding: () => set({ onboardingDone: true }),
      // Zera tambem o pulo: quem chegou por link direto teve o tutorial
      // pulado, e sem isto o botao "Rever a apresentacao" nao fazia nada para
      // sempre naquela visita.
      replayOnboarding: () => set({ onboardingDone: false, pulouOnboarding: false }),
      // Link que chega direto num painel (#orcamento na bio) pula o tutorial.
      // Nao persiste de proposito: quem voltar depois pela home ainda ve.
      pulouOnboarding: false,
      pularOnboarding: () => set({ pulouOnboarding: true }),

      // --- avisos curtos ---
      toasts: [],
      /**
       * `chave` faz o aviso do mesmo assunto SUBSTITUIR o anterior em vez de
       * empilhar: tres toques rapidos em Adicionar enchiam a tela de avisos
       * iguais. `acao` e o botao de desfazer, e ele merece mais tempo de tela
       * do que um aviso que so informa.
       */
      toast: (texto, { chave, acao } = {}) => {
        const id = ++toastSeq
        set((s) => ({
          toasts: [...s.toasts.filter((t) => !chave || t.chave !== chave), { id, texto, chave, acao }],
        }))
        get().agendarFimDoAviso(id, acao ? 6000 : 2600)
      },
      agendarFimDoAviso: (id, ms) => {
        clearTimeout(tempoDosAvisos.get(id))
        tempoDosAvisos.set(
          id,
          setTimeout(() => {
            tempoDosAvisos.delete(id)
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
          }, ms),
        )
      },
      // Com o mouse ou o foco no "Desfazer", o aviso nao some (WCAG 2.2.1). Antes
      // ele sumia aos 6 s mesmo com o foco no botao, e o foco caia no body.
      // Ao sair, ganha mais 3 s para a pessoa terminar de ler.
      segurarAviso: (id) => {
        clearTimeout(tempoDosAvisos.get(id))
        tempoDosAvisos.delete(id)
      },
      soltarAviso: (id) => {
        if (get().toasts.some((t) => t.id === id)) get().agendarFimDoAviso(id, 3000)
      },
    }),
    {
      name: 'brasa-cubas',
      version: 1,
      storage: armazenamento,
      // Guardamos so o que o usuario perderia se recarregasse sem querer.
      partialize: (s) => ({
        cart: s.cart,
        quote: s.quote,
        simpleMode: s.simpleMode,
        onboardingDone: s.onboardingDone,
      }),
      // Peca que sai do catalogo continua no localStorage de quem ja a tinha.
      // O painel e o selo ja a ignoram; sem isto ela ficaria la para sempre,
      // invisivel, indo junto em todo pedido futuro que fosse lido do estado
      // guardado. Sai na hidratacao, antes do primeiro render.
      //
      // O mesmo vale para o que chega com tipo errado (edicao a mao, versao
      // antiga, gravacao truncada). Medido com o localStorage adulterado: um
      // campo do rascunho `null` ou numero derrubava o app inteiro ao abrir o
      // Orcamento (`kind.trim`) — e a cada visita, porque o estado ruim fica
      // guardado; `qty: '2'` fazia o selo somar texto e dizer "02 peças".
      merge: (guardado, atual) => ({
        ...atual,
        ...guardado,
        cart: pedidoGuardado(guardado),
        // O rascunho vem campo a campo POR CIMA do inicial, nunca no lugar
        // dele. Espalhar o objeto guardado inteiro deixava sumir todo campo que
        // nao estivesse la — e o painel de orcamento le `quote.kind.trim()`
        // direto, entao um rascunho de forma antiga (campo acrescentado depois,
        // gravacao truncada) derrubava a arvore inteira do React: tela branca,
        // que sobrevive a recarga porque o estado ruim fica guardado. Medido:
        // com `quote: {}` no localStorage, zero nos e zero texto na pagina.
        // So entra campo que ja existe no inicial e com o mesmo tipo (todos texto).
        quote: {
          ...atual.quote,
          ...Object.fromEntries(
            Object.entries(guardado?.quote ?? {}).filter(([campo, valor]) => typeof valor === typeof atual.quote[campo]),
          ),
        },
      }),
    },
  ),
)

// Duas abas do site abertas: cada uma so lia o armazenamento na carga, e a que
// gravasse depois apagava o que a outra tinha posto no pedido. Medido com um
// iframe da mesma origem: 2 canecas adicionadas "na outra aba" sumiram do
// armazenamento assim que esta mexeu no rascunho. Agora, quando a outra aba grava,
// esta adota o PEDIDO dela. So o pedido: trazer o modo lista trocaria a tela desta
// aba sozinha, e trazer o rascunho apagaria o que esta aba estivesse digitando.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== 'brasa-cubas' || e.newValue == null) return
    let guardado
    try {
      guardado = JSON.parse(e.newValue)?.state
    } catch {
      return
    }
    const cart = pedidoGuardado(guardado)
    if (JSON.stringify(cart) !== JSON.stringify(useStore.getState().cart)) useStore.setState({ cart })
  })
}

// --- dados derivados do carrinho ---
//
// Cuidado: um seletor de zustand precisa devolver sempre a mesma referencia
// para a mesma entrada. Um seletor que monta um array novo a cada chamada faz
// o useSyncExternalStore do React enxergar um estado diferente em todo render
// e entrar em laco infinito. Por isso o carrinho e lido cru (referencia
// estavel) e enriquecido em useMemo.

// Conta so o que o painel do pedido mostra. O carrinho e persistido: uma peca
// que saia do catalogo continua no localStorage de quem ja a tinha, e o selo
// somava uma quantidade que nenhuma linha do painel explicava.
export const selectCartCount = (s) =>
  s.cart.reduce((sum, line) => (productById(line.id) ? sum + line.qty : sum), 0)

export const useCartSummary = () => {
  const cart = useStore((s) => s.cart)

  return useMemo(() => {
    const lines = cart
      .map((line) => {
        const product = productById(line.id)
        return product ? { ...line, product, subtotal: product.price * line.qty } : null
      })
      .filter(Boolean)

    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      total: lines.reduce((sum, line) => sum + line.subtotal, 0),
      // Se alguma peca for "a partir de", o total e so uma estimativa.
      isEstimate: lines.some((line) => line.product.from),
    }
  }, [cart])
}

// Sonda de desenvolvimento: da acesso ao estado pelo console para medir
// enquadramento e fluxo sem depender de clique sintetico. So existe em dev.
if (import.meta.env.DEV) window.__store = useStore
