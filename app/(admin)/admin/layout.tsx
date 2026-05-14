'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Package, ShoppingCart, Settings, LogOut, Menu, X,
  Store, Crown, ExternalLink, Shield, Users, MessageCircle, Wrench, BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { PINManager } from '@/lib/pin';
import PINSetup from '@/components/PINSetup';
import PINUnlock from '@/components/PINUnlock';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, admin, shop, loading, logout } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pinState, setPinState] = useState<'none' | 'setup' | 'locked'>('none');
  const [pinChecked, setPinChecked] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  // Menu principal simplifié — 6 items max
  const navItems = [
    { label: 'Accueil',    href: '/admin/dashboard', icon: Home },
    { label: 'Commandes',  href: '/admin/orders',    icon: ShoppingCart },
    { label: 'Clients',    href: '/admin/clients',   icon: Users },
    { label: 'Produits',   href: '/admin/products',  icon: Package },
    { label: 'WhatsApp',   href: '/admin/whatsapp',  icon: MessageCircle },
    { label: 'Paramètres', href: '/admin/settings',  icon: Settings },
  ];

  // Outils secondaires dans un sous-menu
  const toolItems = [
    { label: 'Statistiques', href: '/admin/stats',        icon: BarChart3 },
    { label: 'Abonnement',   href: '/admin/subscription', icon: Crown },
  ];

  useEffect(() => {
    if (!loading && !user) { router.push('/login'); return; }
    if (!loading && user && !pinChecked) {
      setPinChecked(true);
      if (PINManager.hasPin()) {
        if (!PINManager.isSessionActive()) setPinState('locked');
      } else {
        const offerKey = 'sm_pin_offered_' + user.uid;
        if (!sessionStorage.getItem(offerKey)) {
          sessionStorage.setItem(offerKey, '1');
          setPinState('setup');
        }
      }
    }
  }, [user, loading, pinChecked]);

  async function handleLogout() {
    PINManager.clearSession();
    await logout();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
      <div className="w-12 h-12 border-4 border-wa border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user || !shop) return null;

  const primaryColor = shop?.primaryColor || '#1FB955';
  const allNavItems = [...navItems, ...toolItems];
  const currentLabel = allNavItems.find(item => pathname === item.href)?.label || 'Admin';

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {pinState === 'setup' && <PINSetup primaryColor={primaryColor} onDone={() => setPinState('none')} />}
      {pinState === 'locked' && (
        <PINUnlock shopName={shop?.name} primaryColor={primaryColor}
          onUnlocked={() => { PINManager.startSession(); setPinState('none'); }}
          onSignOut={() => { PINManager.removePin(); handleLogout(); }} />
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 lg:translate-x-0 flex flex-col shadow-soft ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="sidebar-logo flex items-center justify-between px-5 border-b border-slate-100"
          style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))', height: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-wa"
                 style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-ink text-sm block truncate">MasterShopPro</span>
              <span className="text-[10px] text-wa-dark font-extrabold tracking-[0.2em] uppercase">Point de vente</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Boutique */}
        <div className="p-4 border-b border-slate-100">
          <div className="rounded-2xl p-3 border"
               style={{ background: 'linear-gradient(135deg, var(--wa-soft), white)', borderColor: 'rgba(31,185,85,0.2)' }}>
            <div className="flex items-center gap-3 mb-2">
              {shop?.logo
                ? <img src={shop.logo} alt="" className="w-9 h-9 rounded-xl object-cover" />
                : <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-wa"
                       style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>{shop?.name?.charAt(0) || 'S'}</div>}
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-ink text-sm truncate">{shop?.name}</p>
                <p className="text-xs text-slate-500 truncate font-semibold">/{shop?.slug}</p>
              </div>
            </div>
            <Link href={`/${shop?.slug}`} target="_blank"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-extrabold text-wa-dark bg-white rounded-lg hover:bg-wa-soft transition-colors">
              <ExternalLink className="w-3 h-3" />Voir ma boutique
            </Link>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'sidebar-link-active shadow-wa' : 'sidebar-link'}`}
                style={isActive ? { background: 'linear-gradient(135deg,#1FB955,#0E5D32)', color: 'white' } : {}}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {item.href === '/admin/whatsapp' && !isActive && (
                  <span className="ml-auto text-[9px] font-extrabold bg-wa-soft text-wa-dark px-1.5 py-0.5 rounded-full">NEW</span>
                )}
              </Link>
            );
          })}

          {/* Séparateur + Outils */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <button onClick={() => setToolsOpen(!toolsOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all">
              <Wrench className="w-5 h-5 flex-shrink-0" />
              Outils
              <span className={`ml-auto text-slate-400 transition-transform text-xs ${toolsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {toolsOpen && (
              <div className="ml-4 space-y-0.5 mt-0.5">
                {toolItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white shadow-wa' : 'text-slate-500 hover:bg-slate-50'}`}
                      style={isActive ? { background: 'linear-gradient(135deg,#1FB955,#0E5D32)' } : {}}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-8 h-8 rounded-full bg-wa-soft flex items-center justify-center text-wa-dark font-extrabold text-sm">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-ink text-xs truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate font-semibold">{admin?.email}</p>
            </div>
          </div>
          <button onClick={() => setPinState('setup')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-extrabold text-slate-500 hover:bg-slate-50 rounded-lg mb-1">
            <Shield className="w-3.5 h-3.5 text-wa-dark" />
            {PINManager.hasPin() ? 'Modifier le PIN' : 'Créer un PIN'}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-extrabold">
            <LogOut className="w-3.5 h-3.5" />Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:pl-64">
        <header className="admin-header bg-white/85 backdrop-blur-md border-b border-slate-100 flex items-center px-4 lg:px-6 sticky top-0 z-30"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))', height: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 mr-4 p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold text-ink tracking-[-0.01em]">{currentLabel}</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className={`badge ${shop?.planId === 'PRO' ? 'bg-purple-50 text-purple-700 border border-purple-200' : shop?.planId === 'STARTER' ? 'bg-sky-soft text-sky-ink border border-sky/20' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
              <Crown className="w-3 h-3 mr-1" />{shop?.planId || 'FREE'}
            </span>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* BOTTOM NAV MOBILE */}
      <nav className="bottom-nav lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 z-30 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {[
          { href: '/admin/dashboard', icon: Home,          label: 'Accueil' },
          { href: '/admin/orders',    icon: ShoppingCart,  label: 'Commandes' },
          { href: '/admin/clients',   icon: Users,         label: 'Clients' },
          { href: '/admin/products',  icon: Package,       label: 'Produits' },
          { href: '/admin/settings',  icon: Settings,      label: 'Réglages' },
        ].map(item => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${isActive ? 'text-wa-dark' : 'text-slate-400'}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-extrabold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Padding bottom pour la bottom nav sur mobile */}
      <div className="lg:hidden h-16" />
    </div>
  );
}