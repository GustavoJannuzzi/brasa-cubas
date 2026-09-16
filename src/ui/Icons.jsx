// Icones em SVG inline. Traco de 1.6 para casar com o peso da tipografia.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ children, size = 20, ...rest }) => (
  <svg {...base} width={size} height={size} aria-hidden="true" focusable="false" {...rest}>
    {children}
  </svg>
)

export const IconShelf = (p) => (
  <Svg {...p}>
    <path d="M3 8h18M3 15h18M4 5v15M20 5v15" />
    <path d="M8 8V6.5a1.5 1.5 0 0 1 3 0V8M14 15v-1.5a1.5 1.5 0 0 1 3 0V15" />
  </Svg>
)

export const IconNotebook = (p) => (
  <Svg {...p}>
    <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z" />
    <path d="M5 4v14a2 2 0 0 0 2 2M9 9h6M9 13h4" />
  </Svg>
)

export const IconPhotos = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="13" height="11" rx="1.5" />
    <path d="M8 20h11a2 2 0 0 0 2-2V9" />
    <circle cx="7.5" cy="9" r="1.2" />
    <path d="M3 14l3.5-3 4 3.5" />
  </Svg>
)

export const IconHands = (p) => (
  <Svg {...p}>
    <path d="M12 21c4 0 7-2.7 7-6.5V9a1.5 1.5 0 0 0-3 0v3" />
    <path d="M16 12V6a1.5 1.5 0 0 0-3 0v6M13 12V4.5a1.5 1.5 0 0 0-3 0V12" />
    <path d="M10 12V7a1.5 1.5 0 0 0-3 0v8" />
  </Svg>
)

export const IconPhone = (p) => (
  <Svg {...p}>
    <path d="M5 4h3l1.5 4-2 1.5a11 11 0 0 0 5 5L14 12l4 1.5V17a2 2 0 0 1-2.2 2A14 14 0 0 1 3 6.2 2 2 0 0 1 5 4Z" />
  </Svg>
)

export const IconCart = (p) => (
  <Svg {...p}>
    <path d="M3 5h2l2.2 9.2a2 2 0 0 0 2 1.5h7.4a2 2 0 0 0 2-1.6L20 8H6" />
    <circle cx="9.5" cy="19" r="1.4" />
    <circle cx="17" cy="19" r="1.4" />
  </Svg>
)

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const IconBack = (p) => (
  <Svg {...p}>
    <path d="M14 6l-6 6 6 6" />
  </Svg>
)

export const IconArrow = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)

export const IconWhatsapp = (p) => (
  <Svg {...p}>
    <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" />
    <path d="M8.8 8.4c0 3 2.3 5.4 5.3 5.4.6 0 1-.5 1-1.1l-.1-.6-1.7-.5-.7.8a5 5 0 0 1-2.2-2.2l.8-.7-.5-1.7-.6-.1c-.7 0-1.3.5-1.3 1.1Z" />
  </Svg>
)

export const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5l8.5 6 8.5-6" />
  </Svg>
)

export const IconInstagram = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="3.8" />
    <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconSparkle = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
    <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
  </Svg>
)

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)

export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.9 5.8A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.4 3.2M6.4 7.7A17 17 0 0 0 2.5 12S6 18.5 12 18.5c.9 0 1.7-.1 2.5-.4" />
    <path d="M9.9 10.2a3 3 0 0 0 4 4.1" />
  </Svg>
)

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M12 3l9 5-9 5-9-5 9-5Z" />
    <path d="M3 13l9 5 9-5" />
  </Svg>
)

export const IconCube = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Svg>
)

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M5 13l4.5 4.5L19 7" />
  </Svg>
)

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const IconMinus = (p) => (
  <Svg {...p}>
    <path d="M5 12h14" />
  </Svg>
)

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </Svg>
)

export const IconCopy = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
  </Svg>
)

export const IconHelp = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconAlert = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.6v5" />
    <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
)

export const IconHome = (p) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" />
  </Svg>
)

export const IconRuler = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="8.5" width="19" height="7" rx="1.5" />
    <path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4" />
  </Svg>
)

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.4 2" />
  </Svg>
)

export const IconTruck = (p) => (
  <Svg {...p}>
    <path d="M3 7h10v9H3zM13 10h4l3 3v3h-7" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </Svg>
)

// Mapa usado pelos pontos da cena, para o dado ficar declarativo em scene.js.
export const hotspotIcons = {
  shelf: IconShelf,
  notebook: IconNotebook,
  photos: IconPhotos,
  hands: IconHands,
  phone: IconPhone,
}
