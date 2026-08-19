import { describe, expect, it } from "bun:test";
import {
  validateProductInput,
  validateUserInput,
  validateCustomerInput,
  validateTransactionInput,
} from "../../src/lib/validators";

describe("Pure Validation Unit Tests", () => {
  describe("Product Input Validation", () => {
    it("should accept valid product input", () => {
      const res = validateProductInput({
        sku: "PROD-001",
        name: "Espresso Coffee",
        price: 20000,
        stock: 50,
        categoryId: "cat-1",
      });
      expect(res.valid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it("should reject negative product price", () => {
      const res = validateProductInput({
        sku: "PROD-002",
        name: "Invalid Price Product",
        price: -5000,
        stock: 10,
        categoryId: "cat-1",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Harga produk tidak boleh negatif");
    });

    it("should reject negative product stock", () => {
      const res = validateProductInput({
        sku: "PROD-003",
        name: "Invalid Stock Product",
        price: 15000,
        stock: -10,
        categoryId: "cat-1",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Stok produk tidak boleh negatif");
    });

    it("should reject empty product SKU or Name", () => {
      const emptySku = validateProductInput({
        sku: "   ",
        name: "Valid Name",
        price: 10000,
        stock: 5,
        categoryId: "cat-1",
      });
      expect(emptySku.valid).toBe(false);

      const emptyName = validateProductInput({
        sku: "SKU-99",
        name: "",
        price: 10000,
        stock: 5,
        categoryId: "cat-1",
      });
      expect(emptyName.valid).toBe(false);
    });
  });

  describe("User Input Validation", () => {
    it("should accept valid user creation input", () => {
      const res = validateUserInput({
        username: "kasir_utama",
        name: "Budi Kasir",
        password: "secretpassword123",
      });
      expect(res.valid).toBe(true);
    });

    it("should reject password shorter than 6 characters", () => {
      const res = validateUserInput({
        username: "kasir_1",
        name: "Short Password User",
        password: "123",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Password minimal 6 karakter");
    });

    it("should reject empty username or name", () => {
      const res = validateUserInput({
        username: "",
        name: "Valid Name",
        password: "password123",
      });
      expect(res.valid).toBe(false);
    });
  });

  describe("Customer Input Validation", () => {
    it("should accept valid customer input", () => {
      const res = validateCustomerInput({
        name: "Siti Rahma",
        email: "siti@example.com",
        phone: "081234567890",
      });
      expect(res.valid).toBe(true);
    });

    it("should reject invalid email format", () => {
      const res = validateCustomerInput({
        name: "Budi",
        email: "not-an-email-address",
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Format email pelanggan tidak valid");
    });

    it("should reject empty customer name", () => {
      const res = validateCustomerInput({
        name: "   ",
      });
      expect(res.valid).toBe(false);
    });
  });

  describe("Transaction Input Validation", () => {
    it("should accept valid transaction checkout input", () => {
      const res = validateTransactionInput({
        items: [{ productId: "p1", quantity: 2, unitPrice: 10000 }],
        paymentAmount: 50000,
        totalAmount: 20000,
      });
      expect(res.valid).toBe(true);
    });

    it("should reject empty cart items", () => {
      const res = validateTransactionInput({
        items: [],
        paymentAmount: 50000,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Keranjang belanja tidak boleh kosong");
    });

    it("should reject payment amount less than total tagihan", () => {
      const res = validateTransactionInput({
        items: [{ productId: "p1", quantity: 1, unitPrice: 50000 }],
        paymentAmount: 20000,
        totalAmount: 50000,
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain("kurang dari total tagihan");
    });
  });
});
