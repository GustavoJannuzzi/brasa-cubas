import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { productById } from '../data/products'
import { hotspots, panelToHotspot } from '../data/scene'

let toastSeq = 0

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
      goTo: (view) => set({ view, focusedProduct: null }),

      // --- paineis ---
      // null | produtos | produto | orcamento | galeria | processo | contato | carrinho | ajuda
      panel: null,
      selectedProduct: null,

      openPanel: (panel) => {
        const spot = panelToHotspot[panel]
        set({ panel, view: spot ? spot.view : get().view })
        if (spot) get().discover(spot.id)
      },

      closePanel: () => set({ panel: null, selectedProduct: null }),

      // Abre o detalhe do produto e, opcionalmente, aponta a camera para a peca.
      // No celular o painel ocupa quase a tela inteira, entao quem chama passa
      // focus: false — mover a camera atras de uma folha opaca nao serve de nada.
      openProduct: (id, { focus = true } = {}) =>
        set({
          panel: 'produto',
          selectedProduct: id,
          focusedProduct: focus ? id : null,
          view: focus ? 'prateleira' : get().view,
        }),

      // Fecha o painel e destaca a peca na prateleira. E a acao
      // "ver na prateleira": aqui o 3D e o conteudo, nao a decoracao.
      focusProductIn3D: (id) =>
        set({ focusedProduct: id, selectedProduct: id, view: 'prateleira', panel: null }),

      clearFocus: () => set({ focusedProduct: null, selectedProduct: null }),

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
        set({ tourStep: 0, panel: null, view: first.view })
        get().discover(first.id)
      },
      nextTourStep: () => {
        const next = get().tourStep + 1
        if (next >= hotspots.length) {
          set({ tourStep: -1, view: 'home' })
          return
        }
        const spot = hotspots[next]
        set({ tourStep: next, view: spot.view })
        get().discover(spot.id)
      },
      stopTour: () => set({ tourStep: -1 }),

      // --- carrinho ---
      cart: [],
      addToCart: (id, qty) => {
        const product = productById(id)
        if (!product) return
        const amount = Math.max(qty ?? product.minQty, product.minQty)
        set((s) => {
          const existing = s.cart.find((line) => line.id === id)
          return {
            cart: existing
              ? s.cart.map((line) => (line.id === id ? { ...line, qty: line.qty + amount } : line))
              : [...s.cart, { id, qty: amount }],
          }
        })
        get().toast(`${product.name} no pedido`)
      },
      setQty: (id, qty) => {
        const product = productById(id)
        const min = product?.minQty ?? 1
        set((s) => ({
          cart: s.cart.map((line) => (line.id === id ? { ...line, qty: Math.max(min, qty) } : line)),
        }))
      },
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((line) => line.id !== id) })),
      clearCart: () => set({ cart: [] }),

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
      resetQuote: () =>
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
        }),

      // --- preferencias / desempenho ---
      simpleMode: false,
      setSimpleMode: (simpleMode) => set({ simpleMode }),
      toggleSimpleMode: () => set((s) => ({ simpleMode: !s.simpleMode })),
      // Estado do 3D. 'ok' enquanto desenha; 'perdido' quando o contexto WebGL
      // cai (o WKWebView derruba ao voltar de outro app) ou a cena lanca
      // excecao; 'indisponivel' quando o aparelho nem abre WebGL. Quem marca e
      // o App (na sonda) e o Experience (nos eventos do canvas).
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
      replayOnboarding: () => set({ onboardingDone: false }),

      // --- avisos curtos ---
      toasts: [],
      toast: (text) => {
        const id = ++toastSeq
        set((s) => ({ toasts: [...s.toasts, { id, text }] }))
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600)
      },
    }),
    {
      name: 'brasa-cubas',
      version: 1,
      // Guardamos so o que o usuario perderia se recarregasse sem querer.
      partialize: (s) => ({
        cart: s.cart,
        quote: s.quote,
        simpleMode: s.simpleMode,
        onboardingDone: s.onboardingDone,
      }),
    },
  ),
)

// --- dados derivados do carrinho ---
//
// Cuidado: um seletor de zustand precisa devolver sempre a mesma referencia
// para a mesma entrada. Um seletor que monta um array novo a cada chamada faz
// o useSyncExternalStore do React enxergar um estado diferente em todo render
// e entrar em laco infinito. Por isso o carrinho e lido cru (referencia
// estavel) e enriquecido em useMemo.

export const selectCartCount = (s) => s.cart.reduce((sum, line) => sum + line.qty, 0)

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
