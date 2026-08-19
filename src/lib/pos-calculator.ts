/**
 * Utility functions for Point of Sale (POS) calculations
 */

export interface CartItemInput {
  price: number;
  quantity: number;
}

/**
 * Calculates subtotal for array of cart items
 */
export function calculateSubtotal(items: CartItemInput[]): number {
  if (!items || items.length === 0) return 0;
  const subtotal = items.reduce((sum, item) => {
    const price = Math.max(0, item.price || 0);
    const qty = Math.max(0, item.quantity || 0);
    return sum + price * qty;
  }, 0);
  return Math.round(subtotal * 100) / 100;
}

/**
 * Calculates tax amount based on subtotal and tax percentage (default 10%)
 */
export function calculateTax(subtotal: number, taxPercent: number = 10): number {
  if (subtotal <= 0 || taxPercent <= 0) return 0;
  const tax = (subtotal * taxPercent) / 100;
  return Math.round(tax * 100) / 100;
}

/**
 * Calculates discount amount based on subtotal and discount percentage
 */
export function calculateDiscount(subtotal: number, discountPercent: number = 0): number {
  if (subtotal <= 0 || discountPercent <= 0) return 0;
  const discount = (subtotal * Math.min(100, discountPercent)) / 100;
  return Math.round(discount * 100) / 100;
}

/**
 * Calculates grand total amount (subtotal + tax - discount)
 */
export function calculateTotal(subtotal: number, taxAmount: number = 0, discountAmount: number = 0): number {
  const total = subtotal + taxAmount - discountAmount;
  return Math.max(0, Math.round(total * 100) / 100);
}

/**
 * Calculates change amount for payment
 */
export function calculateChange(totalAmount: number, paymentAmount: number): number {
  const change = paymentAmount - totalAmount;
  return Math.round(change * 100) / 100;
}

/**
 * Checks if a product stock is considered low (<= threshold)
 */
export function isLowStock(currentStock: number, threshold: number = 10): boolean {
  return currentStock <= threshold;
}
