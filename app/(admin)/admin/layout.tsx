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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user || !shop) return null;

  const primaryColor = shop?.primaryColor || '#ec4899';
  const allNavItems = [...navItems, ...toolItems];
  const currentLabel = allNavItems.find(item => pathname === item.href)?.label || 'Admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {pinState === 'setup' && <PINSetup primaryColor={primaryColor} onDone={() => setPinState('none')} />}
      {pinState === 'locked' && (
        <PINUnlock shopName={shop?.name} primaryColor={primaryColor}
          onUnlocked={() => { PINManager.startSession(); setPinState('none'); }}
          onSignOut={() => { PINManager.removePin(); handleLogout(); }} />
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 border-b border-gray-100"
          style={{ paddingTop: 'max(1.25rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))', height: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-gray-800 text-sm block truncate">ShopMaster</span>
              <span className="text-[10px] text-orange-500 font-medium">POINT DE VENTE</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 p-1"><X className="w-5 h-5" /></button>
        </div>

        {/* Boutique */}
        <div className="p-4 border-b border-gray-100">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3">
            <div className="flex items-center gap-3 mb-2">
              {shop?.logo
                ? <img src={shop.logo} alt="" className="w-9 h-9 rounded-lg object-cover" />
                : <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-sm">{shop?.name?.charAt(0) || 'S'}</div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{shop?.name}</p>
                <p className="text-xs text-gray-500 truncate">/{shop?.slug}</p>
              </div>
            </div>
            <Link href={`/${shop?.slug}`} target="_blank"
              className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-medium text-orange-600 bg-white rounded-lg hover:bg-orange-50 transition-colors">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                style={isActive ? { backgroundColor: primaryColor } : {}}>
                <item.icon className="w-4.5 h-4.5 w-5 h-5 flex-shrink-0" />
                {item.label}
                {item.href === '/admin/whatsapp' && !isActive && (
                  <span className="ml-auto text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">NEW</span>
                )}
              </Link>
            );
          })}

          {/* Séparateur + Outils */}
          <div className="pt-2 mt-2 border-t border-gray-100">
            <button onClick={() => setToolsOpen(!toolsOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-all">
              <Wrench className="w-5 h-5 flex-shrink-0" />
              Outils
              <span className={`ml-auto text-gray-400 transition-transform text-xs ${toolsOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {toolsOpen && (
              <div className="ml-4 space-y-0.5 mt-0.5">
                {toolItems.map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                      style={isActive ? { backgroundColor: primaryColor } : {}}>
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
        <div className="p-3 border-t border-gray-100"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-xs truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={() => setPinState('setup')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 rounded-lg mb-1">
            <Shield className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            {PINManager.hasPin() ? 'Modifier le PIN' : 'Créer un PIN'}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium">
            <LogOut className="w-3.5 h-3.5" />Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:pl-64">
        <header className="bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 sticky top-0 z-30"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))', height: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">{currentLabel}</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className={`badge ${shop?.planId === 'PRO' ? 'bg-purple-100 text-purple-700' : shop?.planId === 'STARTER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              <Crown className="w-3 h-3 mr-1" />{shop?.planId || 'FREE'}
            </span>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* BOTTOM NAV MOBILE */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex"
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
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
              style={isActive ? { color: primaryColor } : { color: '#9ca3af' }}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Padding bottom pour la bottom nav sur mobile */}
      <div className="lg:hidden h-16" />
    </div>
  );
}