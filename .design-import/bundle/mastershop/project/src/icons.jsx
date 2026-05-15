// Lucide-style outlined icons, hand-tuned for a 24x24 grid, stroke 1.6
const I = ({ d, size = 18, stroke = 1.6, fill, children, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d}/> : children}
  </svg>
);

const Icons = {
  Logo: (p) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none" {...p}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--accent)"/><stop offset="1" stopColor="var(--accent-2)"/></linearGradient></defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#lg)"/>
      <path d="M6 16V8l3 4 3-4v8M14 16V8h2.5a2.5 2.5 0 010 5H14" stroke="#0b0612" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Dashboard: (p)=><I {...p}><path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 9h8V3h-8z"/></I>,
  Inbox: (p)=><I {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 4l-3 8v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3-8z"/></I>,
  Orders: (p)=><I {...p}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></I>,
  Products: (p)=><I {...p}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></I>,
  Customers: (p)=><I {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></I>,
  Storefront: (p)=><I {...p}><path d="M3 9l1-5h16l1 5M5 9v11a1 1 0 001 1h12a1 1 0 001-1V9M9 14h6"/></I>,
  Stats: (p)=><I {...p}><path d="M3 3v18h18M7 14l4-4 4 4 5-5"/></I>,
  Settings: (p)=><I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></I>,
  Search: (p)=><I {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></I>,
  Plus: (p)=><I {...p}><path d="M12 5v14M5 12h14"/></I>,
  Bell: (p)=><I {...p}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></I>,
  Send: (p)=><I {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></I>,
  Paperclip: (p)=><I {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 11-2.83-2.83l8.49-8.48"/></I>,
  Smile: (p)=><I {...p}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></I>,
  Mic: (p)=><I {...p}><path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 22h8"/></I>,
  Phone: (p)=><I {...p}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></I>,
  Video: (p)=><I {...p}><path d="M23 7l-7 5 7 5V7zM14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z"/></I>,
  More: (p)=><I {...p}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></I>,
  MoreV: (p)=><I {...p}><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></I>,
  Check: (p)=><I {...p}><path d="M20 6L9 17l-5-5"/></I>,
  CheckCheck: (p)=><I {...p}><path d="M18 6L7 17l-5-5M22 10l-7.5 7.5L13 16"/></I>,
  ChevronRight: (p)=><I {...p}><path d="M9 18l6-6-6-6"/></I>,
  ChevronLeft: (p)=><I {...p}><path d="M15 18l-6-6 6-6"/></I>,
  ChevronDown: (p)=><I {...p}><path d="M6 9l6 6 6-6"/></I>,
  ArrowUp: (p)=><I {...p}><path d="M12 19V5M5 12l7-7 7 7"/></I>,
  ArrowDown: (p)=><I {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></I>,
  ArrowRight: (p)=><I {...p}><path d="M5 12h14M12 5l7 7-7 7"/></I>,
  TrendUp: (p)=><I {...p}><path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"/></I>,
  Cart: (p)=><I {...p}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></I>,
  Heart: (p)=><I {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></I>,
  Filter: (p)=><I {...p}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></I>,
  X: (p)=><I {...p}><path d="M18 6L6 18M6 6l12 12"/></I>,
  Truck: (p)=><I {...p}><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/></I>,
  Package: (p)=><I {...p}><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></I>,
  Coins: (p)=><I {...p}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1110.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/></I>,
  Sparkle: (p)=><I {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9zM5 16l.7 2.1L8 19l-2.3.9L5 22l-.7-2.1L2 19l2.3-.9z"/></I>,
  Bolt: (p)=><I {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></I>,
  Globe: (p)=><I {...p}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></I>,
  CreditCard: (p)=><I {...p}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></I>,
  Star: (p)=><I {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></I>,
  Eye: (p)=><I {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></I>,
  Trash: (p)=><I {...p}><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></I>,
  Edit: (p)=><I {...p}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></I>,
  MapPin: (p)=><I {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></I>,
  Tag: (p)=><I {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><path d="M7 7h.01"/></I>,
  Lock: (p)=><I {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></I>,
  Tune: (p)=><I {...p}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></I>,
  Layers: (p)=><I {...p}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></I>,
  Notes: (p)=><I {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></I>,
  Clock: (p)=><I {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></I>,
  Help: (p)=><I {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></I>,
  Logout: (p)=><I {...p}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></I>,
  Wallet: (p)=><I {...p}><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 100 4h4v-4z"/></I>,
  Tabler: (p)=><I {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></I>,
};

window.Icons = Icons;
