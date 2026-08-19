// Standalone Pure Validation Utilities for POS Web Application

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateProductInput = (input: {
  sku?: string;
  name?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
}): ValidationResult => {
  if (!input.sku || input.sku.trim() === "") {
    return { valid: false, error: "SKU produk wajib diisi" };
  }
  if (!input.name || input.name.trim() === "") {
    return { valid: false, error: "Nama produk wajib diisi" };
  }
  if (input.price === undefined || input.price === null || isNaN(input.price)) {
    return { valid: false, error: "Harga produk wajib diisi" };
  }
  if (input.price < 0) {
    return { valid: false, error: "Harga produk tidak boleh negatif" };
  }
  if (input.stock === undefined || input.stock === null || isNaN(input.stock)) {
    return { valid: false, error: "Stok produk wajib diisi" };
  }
  if (input.stock < 0) {
    return { valid: false, error: "Stok produk tidak boleh negatif" };
  }
  if (!input.categoryId || input.categoryId.trim() === "") {
    return { valid: false, error: "Kategori produk wajib diisi" };
  }
  return { valid: true };
};

export const validateUserInput = (input: {
  username?: string;
  name?: string;
  password?: string;
}): ValidationResult => {
  if (!input.username || input.username.trim() === "") {
    return { valid: false, error: "Username login wajib diisi" };
  }
  if (!input.name || input.name.trim() === "") {
    return { valid: false, error: "Nama lengkap user wajib diisi" };
  }
  if (!input.password || input.password.trim() === "") {
    return { valid: false, error: "Password login wajib diisi" };
  }
  if (input.password.length < 6) {
    return { valid: false, error: "Password minimal 6 karakter" };
  }
  return { valid: true };
};

export const validateCustomerInput = (input: {
  name?: string;
  email?: string;
  phone?: string;
}): ValidationResult => {
  if (!input.name || input.name.trim() === "") {
    return { valid: false, error: "Nama pelanggan wajib diisi" };
  }
  if (input.email && input.email.trim() !== "") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return { valid: false, error: "Format email pelanggan tidak valid" };
    }
  }
  return { valid: true };
};

export const validateTransactionInput = (input: {
  items?: any[];
  paymentAmount?: number;
  totalAmount?: number;
}): ValidationResult => {
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    return { valid: false, error: "Keranjang belanja tidak boleh kosong" };
  }
  if (input.paymentAmount === undefined || input.paymentAmount === null || input.paymentAmount <= 0) {
    return { valid: false, error: "Jumlah pembayaran wajib diisi dan harus lebih dari 0" };
  }
  if (input.totalAmount !== undefined && input.paymentAmount < input.totalAmount) {
    return {
      valid: false,
      error: `Jumlah pembayaran (Rp ${input.paymentAmount}) kurang dari total tagihan (Rp ${input.totalAmount})`,
    };
  }
  return { valid: true };
};
