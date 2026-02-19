'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, Clock, CheckCircle, ArrowRight, DollarSign, Copy, ExternalLink, BarChart3, PieChart, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardStats, getOrders, getProducts } from '@/lib/firestore';
import { formatPrice, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { shop } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const revenueRef = useRef<HTMLCanvasElement>(null);
  const ordersRef = useRef<HTMLCanvasElement>(null);
  const categoriesRef = useRef<HTMLCanvasElement>(null);
  const chartsInitRef = useRef(false);

  useEffect(() => {
    if (shop?.id) {
      Promise.all([
        getDashboardStats(shop.id),
        getOrders(shop.id),
        getProducts(shop.id),
      ]).then(([s, o, p]) => {
        setStats(s);
        setOrders(o);
        setProducts(p);
        setLoading(false);
      });
    }
  }, [shop?.id]);

  useEffect(() => {
    if (!loading && stats && !chartsInitRef.current) {
      chartsInitRef.current = true;
      initCharts();
    }
  }, [loading, stats, orders, products]);

  function initCharts() {
    // Dynamic import Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    script.onload = () => {
      const Chart = (window as any).Chart;
      if (!Chart) return;
      Chart.defaults.font.family = "'Inter', sans-serif";

      const pc = shop?.primaryColor || '#ec4899';

      // ─ Revenue last 7 days ─
      const last7 = getLast7DaysData(orders);
      if (revenueRef.current) {
        new Chart(revenueRef.current, {
          type: 'line',
          data: {
            labels: last7.map(d => d.label),
            datasets: [{
              label: 'Chiffre d\'affaires',
              data: last7.map(d => d.revenue),
              borderColor: pc,
              backgroundColor: hexToRgba(pc, 0.1),
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointBackgroundColor: pc,
              pointRadius: 4,
              pointHoverRadius: 6,
            }, {
              label: 'Bénéfice',
              data: last7.map(d => d.profit),
              borderColor: '#10b981',
              backgroundColor: 'rgba(16,185,129,0.08)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              borderDash: [4, 4],
              pointBackgroundColor: '#10b981',
              pointRadius: 3,
              pointHoverRadius: 5,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { usePointStyle: true, padding: 15, font: { size: 12 } } },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => ` ${formatPrice(ctx.raw, shop?.currency)}`,
                }
              }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, callback: (v: any) => formatPrice(v, shop?.currency) } }
            }
          }
        });
      }

      // ─ Orders by status (Doughnut) ─
      const statusCounts = {
        'En attente': orders.filter(o => o.status === 'PENDING').length,
        'Confirmée': orders.filter(o => o.status === 'CONFIRMED').length,
        'En préparation': orders.filter(o => o.status === 'PROCESSING').length,
        'Livrée': orders.filter(o => o.status === 'DELIVERED').length,
        'Annulée': orders.filter(o => o.status === 'CANCELLED').length,
      };
      if (ordersRef.current) {
        new Chart(ordersRef.current, {
          type: 'doughnut',
          data: {
            labels: Object.keys(statusCounts),
            datasets: [{
              data: Object.values(statusCounts),
              backgroundColor: ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'],
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 8,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
            }
          }
        });
      }

      // ─ Revenue by category (Bar) ─
      const catRevenue: Record<string, number> = {};
      orders.filter(o => o.status !== 'CANCELLED').forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const prod = products.find(p => p.id === item.productId);
          const cat = prod?.category || 'Autre';
          catRevenue[cat] = (catRevenue[cat] || 0) + item.total;
        });
      });
      const sortedCats = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).slice(0, 7);
      if (categoriesRef.current && sortedCats.length > 0) {
        new Chart(categoriesRef.current, {
          type: 'bar',
          data: {
            labels: sortedCats.map(([k]) => k),
            datasets: [{
              label: 'CA par catégorie',
              data: sortedCats.map(([, v]) => v),
              backgroundColor: sortedCats.map((_, i) => `hsl(${210 + i * 30}, 70%, 60%)`),
              borderRadius: 8,
              borderSkipped: false,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => ` ${formatPrice(ctx.raw, shop?.currency)}` } }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, callback: (v: any) => formatPrice(v, shop?.currency) } }
            }
          }
        });
      }
    };
    document.head.appendChild(script);
  }

  const copyShopLink = () => {
    const link = `${window.location.origin}/${shop?.slug}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const primaryColor = shop?.primaryColor || '#ec4899';

  return (
    <div className="space-y-6">
      {/* Shop Link Banner */}
      <div className="rounded-2xl p-4 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">🔗 Lien de votre boutique</h2>
            <p className="text-white/80 text-sm mt-0.5">Partagez ce lien avec vos clients</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
            <code className="text-sm truncate max-w-[200px]">{typeof window !== 'undefined' ? window.location.origin : ''}/{shop?.slug}</code>
            <button onClick={copyShopLink} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <Link href={`/${shop?.slug}`} target="_blank" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats?.pendingOrders > 0 || stats?.lowStockProducts?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats?.pendingOrders > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-800">{stats.pendingOrders} commande(s) en attente</p>
                <p className="text-sm text-amber-600">Nécessite votre attention</p>
              </div>
              <Link href="/admin/orders" className="text-amber-700 hover:text-amber-800 font-medium text-sm flex-shrink-0">Voir →</Link>
            </div>
          )}
          {stats?.lowStockProducts?.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-800">{stats.lowStockProducts.length} produit(s) stock faible</p>
                <p className="text-sm text-orange-600">Pensez à réapprovisionner</p>
              </div>
              <Link href="/admin/products" className="text-orange-700 hover:text-orange-800 font-medium text-sm flex-shrink-0">Gérer →</Link>
            </div>
          )}
        </div>
      )}

      {/* Today Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingCart, label: "Commandes aujourd'hui", value: stats?.todayOrders || 0, format: 'number', bg: 'bg-blue-100', color: 'text-blue-600', iconColor: primaryColor },
          { icon: DollarSign, label: "CA aujourd'hui", value: stats?.todayRevenue || 0, format: 'price', bg: 'bg-emerald-100', color: 'text-emerald-600' },
          { icon: TrendingUp, label: "Bénéfice aujourd'hui", value: stats?.todayProfit || 0, format: 'price', bg: 'bg-purple-100', color: 'text-purple-600' },
          { icon: Package, label: "Produits actifs", value: stats?.activeProducts || 0, format: 'number', bg: 'bg-amber-100', color: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>
              {s.format === 'price' ? formatPrice(s.value, shop?.currency) : s.value}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}bb)` }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5" />Ce mois</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold">{stats?.monthOrders || 0}</p>
            <p className="text-white/70 text-sm">Commandes</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatPrice(stats?.monthRevenue || 0, shop?.currency)}</p>
            <p className="text-white/70 text-sm">Chiffre d'affaires</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{formatPrice(stats?.monthProfit || 0, shop?.currency)}</p>
            <p className="text-white/70 text-sm">Bénéfice net</p>
          </div>
        </div>
      </div>

      {/* ─── CHARTS ─────────────────────────── */}
      {/* Revenue evolution */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
            <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <h3 className="font-semibold text-gray-800">Évolution CA & Bénéfice — 7 derniers jours</h3>
        </div>
        <div style={{ height: '220px' }}>
          <canvas ref={revenueRef} />
        </div>
      </div>

      {/* Orders + Categories row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Commandes par statut</h3>
          </div>
          <div style={{ height: '200px' }}>
            {orders.length > 0 ? <canvas ref={ordersRef} /> : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="text-center"><ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Aucune commande</p></div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800">CA par catégorie</h3>
          </div>
          <div style={{ height: '200px' }}>
            {orders.length > 0 ? <canvas ref={categoriesRef} /> : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <div className="text-center"><BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Pas encore de ventes</p></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="stat-card">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5" style={{ color: primaryColor }} />État du stock
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Produits actifs', value: stats?.activeProducts || 0, color: '' },
            { label: 'Articles en stock', value: stats?.totalStock || 0, color: '' },
            { label: 'Valeur du stock', value: formatPrice(stats?.stockValue || 0, shop?.currency), isPrice: true },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className={`font-bold ${item.isPrice ? 'text-emerald-600' : 'text-gray-800'}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Commandes récentes</h3>
          <Link href="/admin/orders" className="text-sm font-medium flex items-center gap-1 hover:opacity-80" style={{ color: primaryColor }}>
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {stats?.recentOrders?.length > 0 ? (
          <div className="space-y-3">
            {stats.recentOrders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${order.status === 'PENDING' ? 'bg-amber-100' : order.status === 'DELIVERED' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                    {order.status === 'PENDING' ? <Clock className="w-5 h-5 text-amber-600" /> : order.status === 'DELIVERED' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Package className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.orderNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-800">{formatPrice(order.total, shop?.currency)}</p>
                  <p className="text-xs text-gray-500">{formatDate(order.createdAt, 'short')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune commande pour le moment</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────
function getLast7DaysData(orders: any[]) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('fr', { weekday: 'short', day: 'numeric' });
    const dayOrders = orders.filter(o => o.createdAt?.startsWith(dateStr) && o.status !== 'CANCELLED');
    const revenue = dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const profit = dayOrders.reduce((sum: number, o: any) => sum + (o.profit || 0), 0);
    days.push({ label, revenue, profit });
  }
  return days;
}

function hexToRgba(hex: string, alpha: number) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(236,72,153,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}
