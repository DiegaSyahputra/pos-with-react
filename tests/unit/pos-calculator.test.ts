import { describe, expect, it } from "bun:test";
import {
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  calculateChange,
  isLowStock,
} from "../../src/lib/pos-calculator";

describe("POS Calculator Unit Tests", () => {
  it("should correctly calculate subtotal for cart items", () => {
    const items = [
      { price: 15000, quantity: 2 }, // 30000
      { price: 25000, quantity: 1 }, // 25000
      { price: 5000, quantity: 4 }, // 20000
    ];
    const subtotal = calculateSubtotal(items);
    expect(subtotal).toBe(75000);
  });

  it("should return 0 for empty or invalid cart items", () => {
    expect(calculateSubtotal([])).toBe(0);
    expect(calculateSubtotal([{ price: -1000, quantity: 2 }])).toBe(0);
  });

  it("should calculate 10% tax correctly", () => {
    const subtotal = 100000;
    const tax = calculateTax(subtotal, 10);
    expect(tax).toBe(10000);
  });

  it("should calculate discount percentage correctly", () => {
    const subtotal = 100000;
    const discount = calculateDiscount(subtotal, 15);
    expect(discount).toBe(15000);
  });

  it("should calculate grand total with tax and discount", () => {
    const subtotal = 100000;
    const tax = 10000;
    const discount = 5000;
    const total = calculateTotal(subtotal, tax, discount);
    expect(total).toBe(105000);
  });

  it("should calculate payment change correctly", () => {
    const total = 75000;
    const payment = 100000;
    const change = calculateChange(total, payment);
    expect(change).toBe(25000);
  });

  it("should identify low stock levels correctly", () => {
    expect(isLowStock(5, 10)).toBe(true);
    expect(isLowStock(10, 10)).toBe(true);
    expect(isLowStock(15, 10)).toBe(false);
  });
});
