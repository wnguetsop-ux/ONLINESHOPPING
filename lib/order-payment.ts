import { Order } from './types';

export type PaymentStatus = Order['paymentStatus'];

export type PaymentSnapshot = {
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
};

export function sanitizeMoney(value: number | string | undefined | null): number {
  const parsed = typeof value === 'number' ? value : Number(value || 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

export function getPaymentSnapshot(
  total: number,
  amountPaid?: number,
  paymentStatus?: PaymentStatus,
  orderStatus?: Order['status']
): PaymentSnapshot {
  const safeTotal = sanitizeMoney(total);
  const fallbackPaid =
    typeof amountPaid === 'number'
      ? amountPaid
      : orderStatus === 'DELIVERED'
        ? safeTotal
        : 0;

  const safePaid = Math.min(sanitizeMoney(fallbackPaid), safeTotal);
  const balanceDue = Math.max(safeTotal - safePaid, 0);

  const inferredStatus: PaymentStatus =
    balanceDue <= 0
      ? 'PAID'
      : safePaid > 0
        ? 'PARTIALLY_PAID'
        : 'UNPAID';

  return {
    amountPaid: safePaid,
    balanceDue,
    paymentStatus: inferredStatus,
  };
}

export function normalizeOrderPayment(order: Order): Order {
  const snapshot = getPaymentSnapshot(order.total, order.amountPaid, order.paymentStatus, order.status);
  return {
    ...order,
    ...snapshot,
  };
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return status === 'PAID'
    ? 'Payee'
    : status === 'PARTIALLY_PAID'
      ? 'Partiellement payee'
      : 'Non payee';
}

export function getPaymentProgress(order: Pick<Order, 'total' | 'amountPaid' | 'paymentStatus' | 'status'>): number {
  const snapshot = getPaymentSnapshot(order.total, order.amountPaid, order.paymentStatus, order.status);
  if (!order.total) return 0;
  return Math.min(100, Math.round((snapshot.amountPaid / order.total) * 100));
}
