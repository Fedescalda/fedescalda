// Íconos SVG livianos (sin dependencias). Decorativos por defecto: aria-hidden.
type P = React.SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const IconWhatsApp = (p: P) => (
  <svg {...base} viewBox="0 0 32 32" fill="currentColor" stroke="none" {...p}>
    <path d="M16.04 3C8.86 3 3.04 8.8 3.04 15.96c0 2.3.6 4.53 1.75 6.5L3 29l6.72-1.76a13 13 0 0 0 6.31 1.6h.01c7.17 0 13-5.81 13-12.96C29.04 8.8 23.2 3 16.04 3Zm0 23.66h-.01c-1.95 0-3.86-.52-5.53-1.51l-.4-.24-3.99 1.05 1.07-3.88-.26-.4a10.7 10.7 0 0 1-1.65-5.72c0-5.95 4.85-10.79 10.8-10.79 5.94 0 10.78 4.84 10.78 10.8 0 5.94-4.85 10.7-10.81 10.7Zm5.92-8.08c-.32-.16-1.92-.95-2.22-1.05-.3-.11-.51-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-.33-.16-1.38-.5-2.62-1.6a9.8 9.8 0 0 1-1.81-2.25c-.19-.32-.02-.5.14-.66.15-.14.33-.38.49-.57.16-.19.21-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.12 1.32 3.33.16.21 2.28 3.47 5.52 4.87.77.33 1.37.53 1.84.68.77.24 1.48.21 2.03.13.62-.09 1.92-.78 2.19-1.54.27-.76.27-1.4.19-1.54-.08-.13-.3-.21-.62-.37Z"/>
  </svg>
);
export const IconBag = (p: P) => (<svg {...base} {...p}><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>);
export const IconMenu = (p: P) => (<svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h10"/></svg>);
export const IconClose = (p: P) => (<svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>);
export const IconArrow = (p: P) => (<svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>);
export const IconUpload = (p: P) => (<svg {...base} {...p}><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>);
export const IconDownload = (p: P) => (<svg {...base} {...p}><path d="M12 4v12M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>);
export const IconTruck = (p: P) => (<svg {...base} {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>);
export const IconBrush = (p: P) => (<svg {...base} {...p}><path d="M14 4l6 6-8 8H6v-6l8-8Z"/><path d="M12 6l6 6"/></svg>);
export const IconSpark = (p: P) => (<svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>);
export const IconCheck = (p: P) => (<svg {...base} {...p}><path d="M5 12.5 10 17 19 7"/></svg>);
export const IconShield = (p: P) => (<svg {...base} {...p}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>);
export const IconChat = (p: P) => (<svg {...base} {...p}><path d="M4 5h16v11H8l-4 4V5Z"/></svg>);
export const IconInstagram = (p: P) => (<svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>);
export const IconMail = (p: P) => (<svg {...base} {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>);
export const IconPin = (p: P) => (<svg {...base} {...p}><path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>);
export const IconTrash = (p: P) => (<svg {...base} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>);
export const IconMinus = (p: P) => (<svg {...base} {...p}><path d="M5 12h14"/></svg>);
export const IconPlus = (p: P) => (<svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>);
export const IconFacebook = (p: P) => (<svg {...base} {...p}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z"/></svg>);
