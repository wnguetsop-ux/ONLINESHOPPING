'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, getProducts } from '@/lib/firestore';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, BarChart3, PieChart, Package, ShoppingCart, DollarSign, Activity } from 'lucide-react';

export default function StatsPage() {
  const { shop } = useAuth();
  const [orders, setOrders]   = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState<'7' | '30' | '90'>('7');

  const revenueRef    = useRef<HTMLCanvasElement>(null);
  const ordersRef     = useRef<HTMLCanvasElement>(null);
  const categoriesRef = useRef<HTMLCanvasElement>(null);
  const chartsInit    = useRef(false);
  const chartInstances = useRef<any[]>([]);

  const primaryColor = shop?.primaryColor || '#ec4899';

  useEffect(() => {
    if (!shop?.id) return;
    Promise.all([getOrders(shop.id), getProducts(shop.id)]).then(([o, p]) => {
      setOrders(o); setProducts(p); setLoading(false);
    });
  }, [shop?.id]);

  useEffect(() => {
    if (!loading && orders.length > 0) {
      // Détruire les anciens graphes
      chartInstances.current.forEach(c => { try { c.destroy(); } catch {} });
      chartInstances.current = [];
      chartsInit.current = false;
      initCharts();
    }
  }, [loading, orders, products, period]);

  function getDaysData(days: number) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = days <= 7
        ? date.toLocaleDateString('fr', { weekday: 'short', day: 'numeric' })
        : date.toLocaleDateString('fr', { day: 'numeric', month: 'short' });
      const dayOrders = orders.filter(o => o.createdAt?.startsWith(dateStr) && o.status !== 'CANCELLED');
      result.push({
        label,
        revenue: dayOrders.reduce((s: number, o: any) => s + (o.total || 0), 0),
        profit:  dayOrders.reduce((s: number, o: any) => s + (o.profit || 0), 0),
        count:   dayOrders.length,
      });
    }
    return result;
  }

  function hexToRgba(hex: string, alpha: number) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return `rgba(236,72,153,${alpha})`;
    return `rgba(${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)},${alpha})`;
  }

  function initCharts() {
    if (chartsInit.current) return;
    chartsInit.current = true;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    script.onload = () => {
      const Chart = (window as any).Chart;
      if (!Chart) return;
      Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
      const days = getDaysData(parseInt(period));
      const pc   = primaryColor;

      // ── Courbe CA & Bénéfice ──
      if (revenueRef.current) {
        const c = new Chart(revenueRef.current, {
          type: 'line',
          data: {
            labels: days.map(d => d.label),
            datasets: [
              {
                label: 'CA',
                data: days.map(d => d.revenue),
                borderColor: pc,
                backgroundColor: hexToRgba(pc, 0.1),
                fill: true, tension: 0.4, borderWidth: 2.5,
                pointBackgroundColor: pc, pointRadius: 4, pointHoverRadius: 6,
              },
              {
                label: 'Bénéfice',
                data: days.map(d => d.profit),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.08)',
                fill: true, tension: 0.4, borderWidth: 2,
                borderDash: [4,4],
                pointBackgroundColor: '#10b981', pointRadius: 3, pointHoverRadius: 5,
              }
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top', labels: { usePointStyle: true, padding: 15, font: { size: 12 } } },
              tooltip: { callbacks: { label: (ctx: any) => ` ${formatPrice(ctx.raw, shop?.currency)}` } }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 } } },
              y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, callback: (v: any) => formatPrice(v, shop?.currency) } }
            }
          }
        });
        chartInstances.current.push(c);
      }

      // ── Donut statuts ──
      const statusCounts = {
        'En attente':     orders.filter(o => o.status === 'PENDING').length,
        'Confirmée':      orders.filter(o => o.status === 'CONFIRMED').length,
        'En préparation': orders.filter(o => o.status === 'PROCESSING').length,
        'Livrée':         orders.filter(o => o.status === 'DELIVERED').length,
        'Annulée':        orders.filter(o => o.status === 'CANCELLED').length,
      };
      if (ordersRef.current) {
        const c = new Chart(ordersRef.current, {
          type: 'doughnut',
          data: {
            labels: Object.keys(statusCounts),
            datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#f59e0b','#3b82f6','#8b5cf6','#10b981','#ef4444'], borderWidth: 2, borderColor: '#fff', hoverOffset: 8 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 12, font: { size: 11 } } } }
          }
        });
        chartInstances.current.push(c);
      }

      // ── Bar catégories ──
      const catRevenue: Record<string, number> = {};
      orders.filter(o => o.status !== 'CANCELLED').forEach((order: any) => {
        order.items?.forEach((item: any) => {
          const prod = products.find((p: any) => p.id === item.productId);
          const cat = prod?.category || 'Autre';
          catRevenue[cat] = (catRevenue[cat] || 0) + item.total;
        });
      });
      const sortedCats = Object.entries(catRevenue).sort((a, b) => b[1] - a[1]).slice(0, 7);
      if (categoriesRef.current && sortedCats.length > 0) {
        const c = new Chart(categoriesRef.current, {
          type: 'bar',
          data: {
            labels: sortedCats.map(([k]) => k),
            datasets: [{
              label: 'CA par catégorie',
              data: sortedCats.map(([, v]) => v),
              backgroundColor: sortedCats.map((_, i) => `hsl(${210 + i * 30}, 70%, 60%)`),
              borderRadius: 8, borderSkipped: false,
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
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
        chartInstances.current.push(c);
      }
    };
    document.head.appendChild(script);
  }

  // ── KPIs calculés ────────────────────────────────────────────────────────
  const delivered    = orders.filter(o => o.status === 'DELIVERED');
  const thisMonth    = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
  const monthOrders  = delivered.filter(o => new Date(o.createdAt) >= thisMonth);
  const todayDate    = new Date(); todayDate.setHours(0,0,0,0);
  const todayOrders  = delivered.filter(o => new Date(o.createdAt) >= todayDate);
  const topProducts: Record<string, number> = {};
  orders.filter(o => o.status !== 'CANCELLED').forEach((o: any) => {
    o.items?.forEach((item: any) => {
      topProducts[item.productName] = (topProducts[item.productName] || 0) + item.quantity;
    });
  });
  const topProductsList = Object.entries(topProducts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Statistiques</h1>
        <p className="text-gray-500 text-sm">Vue d'ensemble de votre activité</p>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: ShoppingCart, label: "Aujourd'hui",    value: todayOrders.length,                          sub: formatPrice(todayOrders.reduce((s,o)=>s+o.total,0), shop?.currency), color: 'text-blue-600',    bg: 'bg-blue-100' },
          { icon: DollarSign,   label: 'Ce mois',        value: formatPrice(monthOrders.reduce((s,o)=>s+o.total,0), shop?.currency), sub: `${monthOrders.length} commandes`, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { icon: TrendingUp,   label: 'Bénéfice mois',  value: formatPrice(monthOrders.reduce((s,o)=>s+o.profit,0), shop?.currency), sub: 'net ce mois',     color: 'text-purple-600',  bg: 'bg-purple-100' },
          { icon: Package,      label: 'Total commandes', value: delivered.length,                           sub: 'livrées au total',  color: 'text-amber-600',   bg: 'bg-amber-100' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
              <s.icon className={`w-4.5 h-4.5 ${s.color}`} style={{ width: 18, height: 18 }} />
            </div>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Sélecteur de période */}
      <div className="flex gap-2">
        {([['7','7 jours'],['30','30 jours'],['90','3 mois']] as const).map(([val, label]) => (
          <button key={val} onClick={() => setPeriod(val)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${period === val ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            style={period === val ? { backgroundColor: primaryColor } : {}}>
            {label}
          </button>
        ))}
      </div>

      {/* Courbe CA & Bénéfice */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
            <TrendingUp className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <h3 className="font-bold text-gray-800">CA & Bénéfice — {period === '7' ? '7 derniers jours' : period === '30' ? '30 derniers jours' : '3 derniers mois'}</h3>
        </div>
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Aucune donnée disponible</div>
        ) : (
          <div style={{ height: 220 }}><canvas ref={revenueRef} /></div>
        )}
      </div>

      {/* Statuts + Catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <PieChart className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800">Commandes par statut</h3>
          </div>
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Aucune commande</div>
          ) : (
            <div style={{ height: 200 }}><canvas ref={ordersRef} /></div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-800">CA par catégorie</h3>
          </div>
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Pas encore de ventes</div>
          ) : (
            <div style={{ height: 200 }}><canvas ref={categoriesRef} /></div>
          )}
        </div>
      </div>

      {/* Top produits */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
            <Activity className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <h3 className="font-bold text-gray-800">Top produits vendus</h3>
        </div>
        {topProductsList.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucune vente enregistrée</p>
        ) : (
          <div className="space-y-2">
            {topProductsList.map(([name, qty], i) => {
              const max = topProductsList[0][1];
              const pct = Math.round((qty / max) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-400 w-5 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-700 truncate">{name}</p>
                      <p className="text-xs font-bold text-gray-500 flex-shrink-0 ml-2">{qty} vendus</p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: primaryColor }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Résumé stock */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-bold text-gray-800">État du stock</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Produits actifs',  value: products.filter((p:any) => p.isActive).length },
            { label: 'Articles en stock', value: products.reduce((s:number,p:any) => s + p.stock, 0) },
            { label: 'Valeur du stock',   value: formatPrice(products.reduce((s:number,p:any) => s + p.stock * p.costPrice, 0), shop?.currency) },
          ].map((s, i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-lg font-black text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}