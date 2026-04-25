import { ORDER_PREFIX } from '../constants/app.constants';

/**
 * Generates a unique order number in the format CF-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit alphanumeric code.
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${ORDER_PREFIX}-${date}-${random}`;
}
