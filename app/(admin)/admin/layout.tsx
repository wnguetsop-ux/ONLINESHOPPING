'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Menu, X, Store, Crown, ExternalLink, Shield } from 'lucide-react';
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

  const navItems = [
    { label: t('nav.dashboard'),    href: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('nav.products'),     href: '/admin/products',  icon: Package },
    { label: t('nav.orders'),       href: '/admin/orders',    icon: ShoppingCart },
    { label: t('nav.subscription'), href: '/admin/subscription', icon: Crown },
    { label: t('nav.settings'),     href: '/admin/settings',  icon: Settings },
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

  return (
    <div className="min-h-screen bg-gray-50">
      {pinState === 'setup' && <PINSetup primaryColor={primaryColor} onDone={() => setPinState('none')} />}
      {pinState === 'locked' && (
        <PINUnlock shopName={shop?.name} primaryColor={primaryColor}
          onUnlocked={() => { PINManager.startSession(); setPinState('none'); }}
          onSignOut={() => { PINManager.removePin(); handleLogout(); }} />
      )}

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

        <div className="p-4 border-b border-gray-100">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {shop?.logo
                ? <img src={shop.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                : <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">{shop?.name?.charAt(0) || 'S'}</div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{shop?.name}</p>
                <p className="text-xs text-gray-500 truncate">/{shop?.slug}</p>
              </div>
            </div>
            <Link href={`/${shop?.slug}`} target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-orange-600 bg-white rounded-lg hover:bg-orange-50 transition-colors">
              <ExternalLink className="w-4 h-4" />Voir ma boutique
            </Link>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-white"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 text-sm truncate">{admin?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{admin?.email}</p>
            </div>
          </div>
          <button onClick={() => setPinState('setup')}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            <Shield className="w-4 h-4" style={{ color: primaryColor }} />
            {PINManager.hasPin() ? 'Modifier le PIN' : 'Creer un PIN acces rapide'}
          </button>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium">
            <LogOut className="w-4 h-4" />Deconnexion
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 sticky top-0 z-30"
          style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))', height: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            {navItems.find(item => pathname === item.href)?.label || 'Admin'}
          </h1>
          <div className="ml-auto">
            <span className={`badge ${shop?.planId === 'PRO' ? 'bg-purple-100 text-purple-700' : shop?.planId === 'STARTER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
              <Crown className="w-3 h-3 mr-1" />{shop?.planId || 'FREE'}
            </span>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}