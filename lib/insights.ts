// lib/insights.ts
// Priorités du jour — calcul local, pas d'appel IA à chaque chargement

export interface DayInsight {
  emoji: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  href?: string;
}

export function computeDayInsights(
  orders: any[],
  currency: string = 'XAF'
): DayInsight[] {
  const insights: DayInsight[] = [];
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const twoDaysAgo = new Date(now); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // 1. Commandes en attente de confirmation
  const pending = orders.filter(o => o.status === 'PENDING');
  if (pending.length > 0) {
    insights.push({
      emoji: '⏳',
      text: `${pending.length} commande${pending.length > 1 ? 's' : ''} en attente de confirmation`,
      priority: 'high',
      href: '/admin/orders',
    });
  }

  // 2. Montant à récupérer
  const unpaid = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status));
  const totalUnpaid = unpaid.reduce((s: number, o: any) => s + (o.total || 0), 0);
  if (totalUnpaid > 0) {
    const formatted = totalUnpaid.toLocaleString('fr-FR') + ' ' + currency;
    insights.push({
      emoji: '💰',
      text: `${formatted} restent à encaisser`,
      priority: 'high',
      href: '/admin/orders',
    });
  }

  // 3. Clients à relancer (commandes non livrées depuis +2 jours)
  const toRelance = orders.filter(o =>
    ['PENDING','CONFIRMED','PROCESSING'].includes(o.status) &&
    new Date(o.createdAt) < twoDaysAgo
  );
  if (toRelance.length > 0) {
    const names = [...new Set(toRelance.map((o: any) => o.customerName))].slice(0, 2);
    const extra = toRelance.length > 2 ? ` +${toRelance.length - 2}` : '';
    insights.push({
      emoji: '📩',
      text: `Relancer : ${names.join(', ')}${extra}`,
      priority: 'medium',
      href: '/admin/clients',
    });
  }

  // 4. Commandes livrées aujourd'hui
  const deliveredToday = orders.filter(o =>
    o.status === 'DELIVERED' && new Date(o.createdAt) >= todayStart
  );
  if (deliveredToday.length > 0) {
    const revenue = deliveredToday.reduce((s: number, o: any) => s + (o.total || 0), 0);
    insights.push({
      emoji: '✅',
      text: `${deliveredToday.length} commande${deliveredToday.length > 1 ? 's' : ''} livrée${deliveredToday.length > 1 ? 's' : ''} aujourd'hui — ${revenue.toLocaleString('fr-FR')} ${currency}`,
      priority: 'low',
    });
  }

  // 5. Aucune activité aujourd'hui
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= todayStart);
  if (todayOrders.length === 0 && orders.length > 0) {
    insights.push({
      emoji: '📢',
      text: "Aucune commande aujourd'hui — pensez à partager votre boutique",
      priority: 'low',
      href: '/admin/settings',
    });
  }

  // Limite à 4 insights max, triés par priorité
  const order = { high: 0, medium: 1, low: 2 };
  return insights
    .sort((a, b) => order[a.priority] - order[b.priority])
    .slice(0, 4);
}