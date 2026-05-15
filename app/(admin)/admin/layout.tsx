'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Copy,
  Crown,
  ExternalLink,
  Home,
  Inbox,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

// Produits au centre (position 3/5) = zone de pouce dominante sur mobile
const BOTTOM_NAV = [
  { href: '/admin/inbox',    icon: Inbox,       label: 'Inbox' },
  { href: '/admin/orders',   icon: ShoppingBag, label: 'Commandes' },
  { href: '/admin/products', icon: Package,      label: 'Produits',  featured: true },
  { href: '/admin/clients',  icon: Users,        label: 'Clients' },
  { href: '/admin/settings', icon: Settings,     label: 'Reglages' },
];

// Produits en 1er dans la sidebar — c'est le cœur de l'app
const SIDEBAR_MAIN = [
  { href: '/admin/products',  icon: Package,       label: 'Produits',        featured: true },
  { href: '/admin/dashboard', icon: Home,          label: 'Tableau de bord' },
  { href: '/admin/inbox',     icon: Inbox,         label: 'Inbox' },
  { href: '/admin/orders',    icon: ShoppingBag,   label: 'Commandes' },
  { href: '/admin/clients',   icon: Users,         label: 'Clients' },
  { href: '/admin/whatsapp',  icon: MessageCircle, label: 'WhatsApp' },
];

const SIDEBAR_TOOLS = [
  { href: '/admin/stats', icon: BarChart3, label: 'Statistiques' },
  { href: '/admin/subscription', icon: Crown, label: 'Abonnement' },
  { href: '/admin/settings', icon: Settings, label: 'Parametres' },
];

function PlanBadge({ planId }: { planId?: string }) {
  const classes = {
    PRO: 'bg-purple-100 text-purple-700 border-purple-200',
    STANDARD: 'bg-[#E2F7CB] text-[#128C7E] border-[#BBF7D0]',
    STARTER: 'bg-blue-100 text-blue-700 border-blue-200',
    FREE: 'bg-slate-100 text-slate-500 border-slate-200',
  }[planId || 'FREE'] ?? 'bg-slate-100 text-slate-500 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${classes}`}>
      <Crown className="h-2.5 w-2.5" />
      {planId || 'FREE'}
    </span>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, admin, shop, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  function copyShopLink() {
    if (!shop?.slug) return;
    navigator.clipboard.writeText(`${window.location.origin}/${shop.slug}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, router, user]);

  async function handleLogout() {
    await logout();
  }

  if (loading) {
    return (
      <div className="premium-mesh min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-wa border-t-transparent" />
      </div>
    );
  }

  if (!user || !shop) return null;

  const allItems = [...SIDEBAR_MAIN, ...SIDEBAR_TOOLS];
  const pageLabel = allItems.find((item) => pathname === item.href)?.label || 'Admin';

  return (
    <div className="premium-mesh min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-app-border bg-white/88 shadow-[24px_0_80px_rgba(15,23,42,0.06)] backdrop-blur-2xl
          transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="sidebar-logo flex items-center justify-between border-b border-app-border bg-white/45 px-5">
          <div className="flex items-center gap-3">
            <div className="premium-icon flex h-9 w-9 items-center justify-center rounded-xl bg-wa text-white shadow-wa">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-[13px] font-bold text-slate-800">MasterShopPro</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-wa-dark">WhatsApp Back-office</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="btn-icon text-slate-400 hover:bg-slate-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-app-border p-4">
          <div className="premium-glow rounded-2xl border border-wa-border bg-wa-soft/90 p-3 shadow-[0_18px_45px_rgba(31,185,85,0.10)]">
            <div className="mb-2.5 flex items-center gap-3">
              {shop.logo ? (
                <img src={shop.logo} alt="" className="h-9 w-9 rounded-xl object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-wa text-sm font-bold text-white">
                  {shop.name?.charAt(0) || 'S'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{shop.name}</p>
                <p className="truncate text-xs text-slate-500">/{shop.slug}</p>
              </div>
            </div>
            <Link
              href={`/${shop.slug}`}
              target="_blank"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-wa-border bg-white py-1.5 text-xs font-semibold text-wa-dark transition-colors hover:bg-white/80"
            >
              <ExternalLink className="h-3 w-3" />
              Voir le lien client
            </Link>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {SIDEBAR_MAIN.map((item: any) => {
            const active = pathname === item.href;
            if (item.featured) return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl font-extrabold text-sm transition-all shadow-wa"
                style={active
                  ? { background: 'linear-gradient(135deg,#1FB955,#0E5D32)', color: 'white' }
                  : { background: 'linear-gradient(135deg,rgba(31,185,85,0.12),rgba(14,93,50,0.06))', color: 'var(--wa-dark)', border: '1px solid rgba(31,185,85,0.2)' }
                }
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
                <span className="ml-auto text-[9px] font-extrabold tracking-[0.18em] uppercase opacity-70">Cœur</span>
              </Link>
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={active ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
                {item.href === '/admin/whatsapp' && !active && (
                  <span className="ml-auto rounded-full bg-wa px-1.5 py-0.5 text-[9px] font-bold text-white">IA</span>
                )}
              </Link>
            );
          })}

          <div className="mt-1 space-y-0.5 border-t border-app-border pt-2">
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Outils</p>
            {SIDEBAR_TOOLS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={active ? 'sidebar-link-active' : 'sidebar-link'}
                >
                  <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-app-border bg-white/45 p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="mb-3 flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-wa-border bg-wa-soft text-sm font-bold text-wa-dark">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">{admin?.name || 'Admin'}</p>
              <PlanBadge planId={shop.planId} />
            </div>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="sidebar-link w-full text-xs text-red-500 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Deconnexion
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="admin-header sticky top-0 z-30 flex items-center border-b border-app-border bg-white/82 px-4 shadow-[0_16px_50px_rgba(15,23,42,0.04)] backdrop-blur-2xl lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="btn-icon mr-2 text-slate-600 hover:bg-slate-100 lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold text-slate-800">{pageLabel}</h1>
          <div className="ml-auto flex items-center gap-3">
            <PlanBadge planId={shop.planId} />
            <div className="hidden items-center gap-1.5 rounded-full border border-wa-border bg-wa-soft px-2.5 py-1 text-[11px] font-semibold text-wa-dark sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wa opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-wa" />
              </span>
              Connecte
            </div>
          </div>
        </header>

        <main className="page-enter mb-bar-safe p-4 lg:mb-0 lg:p-6">{children}</main>
      </div>

      {/* ── FLOATING SHARE BAR — boutique toujours accessible ── */}
      {shop?.slug && (
        <div className="fixed bottom-[4.5rem] left-3 right-3 z-30 lg:hidden">
          <div className="flex items-center gap-2 rounded-2xl border border-wa/20 px-4 py-2.5 shadow-wa"
               style={{ background: 'linear-gradient(135deg,#052e25,#0E5D32)' }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/55">Ma boutique</p>
              <p className="text-[12px] font-extrabold text-white truncate">/{shop.slug}</p>
            </div>
            <button onClick={copyShopLink}
                    className="h-9 px-3 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all"
                    style={{ background: shareCopied ? '#1FB955' : 'rgba(255,255,255,0.15)', color: 'white' }}>
              <Copy className="h-3.5 w-3.5" />
              {shareCopied ? 'Copié !' : 'Copier'}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Bonjour ! Découvre ma boutique : ${window?.location?.origin ?? ''}/${shop.slug}`)}`}
               target="_blank" rel="noopener noreferrer"
               className="h-9 px-3 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5"
               style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
              <MessageCircle className="h-3.5 w-3.5" />
              Partager
            </a>
            <Link href={`/${shop.slug}`} target="_blank"
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-30 flex items-end border-t border-app-border bg-white/90 shadow-[0_-18px_55px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:hidden"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {(BOTTOM_NAV as any[]).map((item) => {
          const active = pathname === item.href;
          if (item.featured) return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center justify-end pb-2 -mt-5"
            >
              {/* Bouton central élevé — zone de pouce dominante */}
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-wa transition-all ${
                active ? 'scale-110' : 'hover:scale-105'
              }`} style={{ background: active ? 'linear-gradient(135deg,#1FB955,#0E5D32)' : 'linear-gradient(135deg,#1FB955cc,#0E5D32cc)' }}>
                <item.icon className="h-6 w-6 text-white stroke-[2.5]" />
              </div>
              <span className={`mt-1 text-[9px] font-extrabold ${active ? 'text-wa-dark' : 'text-slate-500'}`}>{item.label}</span>
            </Link>
          );
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? 'text-wa-dark' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[9px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              {active && <span className="mt-0.5 h-1 w-1 rounded-full bg-wa" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
