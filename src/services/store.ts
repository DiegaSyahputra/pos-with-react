import { prisma } from "../db";
import { generateInvoiceNumber } from "../lib/invoice-generator";

// Interfaces for Memory Fallback State
interface MemoryUser {
  id: string;
  username: string;
  password: string;
  name: string;
  email?: string | null;
  role: string;
}

interface MemoryCategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryProduct {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  stock: number;
  imageUrl?: string | null;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Fallback State (when PostgreSQL DB is disconnected)
let memoryUsers: MemoryUser[] = [
  {
    id: "usr-1",
    username: "admin",
    password: "$2a$10$8.Xy1/Y1u.p.x2k/c9X/7e8n3uX9r8a7b6c5d4e3f2g1h0i9j8k7",
    name: "Administrator POS",
    email: "admin@pos.com",
    role: "ADMIN",
  },
  {
    id: "usr-2",
    username: "kasir",
    password: "$2a$10$8.Xy1/Y1u.p.x2k/c9X/7e8n3uX9r8a7b6c5d4e3f2g1h0i9j8k7",
    name: "Kasir Toko Utama",
    email: "kasir@pos.com",
    role: "CASHIER",
  },
];

let memoryCategories: MemoryCategory[] = [
  {
    id: "cat-1",
    name: "Minuman (Beverages)",
    description: "Aneka kopi, teh, boba, dan jus segar",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-2",
    name: "Makanan Utama (Main Course)",
    description: "Nasi goreng, mie, dan hidangan berat",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cat-3",
    name: "Camilan (Snacks)",
    description: "Kentang goreng, roti bakar, kue",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let memoryProducts: MemoryProduct[] = [
  {
    id: "prod-1",
    sku: "BEV-001",
    name: "Kopi Susu Gula Aren",
    description: "Espresso premium dengan susu segar & gula aren",
    price: 18000,
    costPrice: 8000,
    stock: 45,
    imageUrl:
      "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-2",
    sku: "BEV-002",
    name: "Matcha Latte Ice",
    description: "Bubuk matcha jepang pilihan dengan fresh milk",
    price: 22000,
    costPrice: 10000,
    stock: 30,
    imageUrl:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-3",
    sku: "BEV-003",
    name: "Es Teh Manis Jumbo",
    description: "Teh melati harum porsi besar",
    price: 8000,
    costPrice: 2500,
    stock: 5,
    imageUrl:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-4",
    sku: "FOD-001",
    name: "Nasi Goreng Spesial POS",
    description: "Nasi goreng rempah dengan telur mata sapi & ayam",
    price: 28000,
    costPrice: 12000,
    stock: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-5",
    sku: "FOD-002",
    name: "Mie Goreng Rendang",
    description: "Mie telur tumis dengan potongan daging rendang",
    price: 32000,
    costPrice: 15000,
    stock: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-6",
    sku: "SNK-001",
    name: "French Fries BBQ",
    description: "Kentang renyah tabur bumbu BBQ gurih",
    price: 15000,
    costPrice: 6000,
    stock: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "prod-7",
    sku: "SNK-002",
    name: "Roti Bakar Cokelat Keju",
    description: "Roti bakar lelehan cokelat & keju cheddar",
    price: 18000,
    costPrice: 7000,
    stock: 3,
    imageUrl:
      "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bff?auto=format&fit=crop&w=400&q=80",
    categoryId: "cat-3",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let memoryCustomers: MemoryCustomer[] = [
  {
    id: "cust-1",
    name: "Budi Santoso",
    phone: "081234567890",
    email: "budi.santoso@example.com",
    points: 120,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "cust-2",
    name: "Siti Rahmawati",
    phone: "089876543210",
    email: "siti.rahma@example.com",
    points: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let memoryTransactions: any[] = [
  {
    id: "tx-1",
    invoiceNo: generateInvoiceNumber(1),
    totalAmount: 64000,
    taxAmount: 5800,
    discountAmount: 0,
    paymentMethod: "CASH",
    paymentAmount: 70000,
    changeAmount: 6000,
    customerId: "cust-1",
    customer: { id: "cust-1", name: "Budi Santoso", phone: "081234567890" },
    userId: "usr-2",
    user: {
      id: "usr-2",
      name: "Kasir Toko Utama",
      username: "kasir",
      role: "CASHIER",
    },
    createdAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    items: [
      {
        id: "item-1",
        productId: "prod-1",
        productName: "Kopi Susu Gula Aren",
        quantity: 2,
        unitPrice: 18000,
        subtotal: 36000,
      },
      {
        id: "item-2",
        productId: "prod-4",
        productName: "Nasi Goreng Spesial POS",
        quantity: 1,
        unitPrice: 28000,
        subtotal: 28000,
      },
    ],
  },
];

export const POSStore = {
  // User Authentication & Profile
  async loginUser(username: string, password: string) {
    try {
      const dbUser = (prisma as any).user;
      if (!dbUser) throw new Error("Database user model not initialized");

      const user = await dbUser.findUnique({ where: { username } });
      if (!user) {
        throw new Error("Username atau password salah");
      }

      let isMatch = false;
      try {
        isMatch = await Bun.password.verify(password, user.password);
      } catch {
        isMatch = user.password === password;
      }

      if (!isMatch) {
        throw new Error("Username atau password salah");
      }

      const { password: _, ...userProfile } = user;
      return userProfile;
    } catch (err: any) {
      if (err.message && err.message.includes("salah")) {
        throw err;
      }
      const user = memoryUsers.find((u) => u.username === username);
      if (!user) {
        throw new Error("Username atau password salah");
      }

      let isMatch = false;
      try {
        isMatch = await Bun.password.verify(password, user.password);
      } catch {
        isMatch =
          (username === "admin" && password === "admin123") ||
          (username === "kasir" && password === "kasir123") ||
          user.password === password;
      }

      if (!isMatch) {
        throw new Error("Username atau password salah");
      }

      const { password: _, ...userProfile } = user;
      return userProfile;
    }
  },

  async getUserById(id: string) {
    try {
      const dbUser = (prisma as any).user;
      if (!dbUser) return null;
      const user = await dbUser.findUnique({ where: { id } });
      if (!user) return null;
      const { password: _, ...userProfile } = user;
      return userProfile;
    } catch {
      const user = memoryUsers.find((u) => u.id === id);
      if (!user) return null;
      const { password: _, ...userProfile } = user;
      return userProfile;
    }
  },

  async getUsers(params?: { page?: number; limit?: number; role?: string }) {
    const page = params?.page ? Math.max(1, Number(params.page)) : 1;
    const limit = params?.limit ? Math.max(1, Number(params.limit)) : 20;
    const skip = (page - 1) * limit;

    try {
      const dbUser = (prisma as any).user;
      if (!dbUser) {
        // Fallback memory: filter role jika param dikirim
        const filteredMemory = params?.role
          ? memoryUsers.filter((u) => u.role === params.role)
          : memoryUsers;

        return {
          data: filteredMemory.map(({ password: _, ...u }) => u),
          meta: {
            total: filteredMemory.length,
            page: 1,
            limit: 100,
            totalPages: 1,
          },
        };
      }

      // Buat kondisi filter dimana jika role dikirimkan
      const where = params?.role ? { role: params.role } : {};

      const [users, total] = await prisma.$transaction([
        dbUser.findMany({
          where,
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { name: "asc" },
          skip,
          take: limit,
        }),
        dbUser.count({ where }),
      ]);

      return {
        data: users,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      // Fallback error memory: filter role jika param dikirim
      const filteredMemory = params?.role
        ? memoryUsers.filter((u) => u.role === params.role)
        : memoryUsers;

      return {
        data: filteredMemory.map(({ password: _, ...u }) => u),
        meta: {
          total: filteredMemory.length,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      };
    }
  },

  // async getUsers(params?: { page?: number; limit?: number }) {
  //   const page = params?.page ? Math.max(1, Number(params.page)) : 1;
  //   const limit = params?.limit ? Math.max(1, Number(params.limit)) : 20;
  //   const skip = (page - 1) * limit;

  //   try {
  //     const dbUser = (prisma as any).user;
  //     if (!dbUser) {
  //       return {
  //         data: memoryUsers.map(({ password: _, ...u }) => u),
  //         meta: {
  //           total: memoryUsers.length,
  //           page: 1,
  //           limit: 100,
  //           totalPages: 1,
  //         },
  //       };
  //     }

  //     const [users, total] = await prisma.$transaction([
  //       dbUser.findMany({
  //         select: {
  //           id: true,
  //           username: true,
  //           name: true,
  //           email: true,
  //           role: true,
  //           createdAt: true,
  //           updatedAt: true,
  //         },
  //         orderBy: { name: "asc" },
  //         skip,
  //         take: limit,
  //       }),
  //       dbUser.count(),
  //     ]);

  //     return {
  //       data: users,
  //       meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  //     };
  //   } catch {
  //     return {
  //       data: memoryUsers.map(({ password: _, ...u }) => u),
  //       meta: { total: memoryUsers.length, page: 1, limit: 100, totalPages: 1 },
  //     };
  //   }
  // },

  async createUser(data: {
    username: string;
    name: string;
    email?: string;
    password: string;
    role?: string;
  }) {
    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: "bcrypt",
      cost: 10,
    });
    const userRole = (data.role || "CASHIER").toUpperCase();

    try {
      const dbUser = (prisma as any).user;
      if (!dbUser) throw new Error("Database user model not initialized");

      const created = await dbUser.create({
        data: {
          username: data.username,
          name: data.name,
          email: data.email || null,
          password: hashedPassword,
          role: userRole,
        },
      });
      const { password: _, ...userProfile } = created;
      return userProfile;
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("Username atau email sudah digunakan");
      }
      const existing = memoryUsers.find((u) => u.username === data.username);
      if (existing) throw new Error("Username sudah digunakan");

      const newUser: MemoryUser = {
        id: `usr-${Date.now()}`,
        username: data.username,
        name: data.name,
        email: data.email || null,
        password: hashedPassword,
        role: userRole,
      };
      memoryUsers.push(newUser);
      const { password: _, ...userProfile } = newUser;
      return userProfile;
    }
  },

  async updateUser(
    id: string,
    data: { name?: string; email?: string; role?: string; password?: string },
  ) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.role) updateData.role = data.role.toUpperCase();
    if (data.password && data.password.trim() !== "") {
      updateData.password = await Bun.password.hash(data.password, {
        algorithm: "bcrypt",
        cost: 10,
      });
    }

    try {
      const dbUser = (prisma as any).user;
      if (dbUser) {
        const updated = await dbUser.update({
          where: { id },
          data: updateData,
        });
        const { password: _, ...userProfile } = updated;
        return userProfile;
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("Email sudah digunakan oleh user lain");
      }
    }

    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    const existing = memoryUsers[idx]!;
    memoryUsers[idx] = { ...existing, ...updateData };
    const { password: _, ...userProfile } = memoryUsers[idx]!;
    return userProfile;
  },

  async deleteUser(id: string) {
    try {
      const dbUser = (prisma as any).user;
      if (dbUser) {
        const deleted = await dbUser.delete({ where: { id } });
        const { password: _, ...userProfile } = deleted;
        return userProfile;
      }
    } catch (err: any) {
      throw new Error(err.message || "Gagal menghapus user");
    }

    const idx = memoryUsers.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("User not found");
    const deleted = memoryUsers[idx]!;
    memoryUsers = memoryUsers.filter((u) => u.id !== id);
    const { password: _, ...userProfile } = deleted;
    return userProfile;
  },

  async updateUserProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
      oldPassword?: string;
      newPassword?: string;
    },
  ) {
    try {
      const dbUser = (prisma as any).user;
      let existingUser = null;
      if (dbUser) {
        existingUser = await dbUser.findUnique({ where: { id: userId } });
      } else {
        existingUser = memoryUsers.find((u) => u.id === userId);
      }

      if (!existingUser) throw new Error("User tidak ditemukan");

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email || null;

      if (data.newPassword && data.newPassword.trim() !== "") {
        if (!data.oldPassword) {
          throw new Error("Password lama wajib diisi untuk mengubah password");
        }

        let isOldMatch = false;
        try {
          isOldMatch = await Bun.password.verify(
            data.oldPassword,
            existingUser.password,
          );
        } catch {
          isOldMatch = existingUser.password === data.oldPassword;
        }

        if (!isOldMatch) {
          throw new Error("Password lama salah");
        }

        updateData.password = await Bun.password.hash(data.newPassword, {
          algorithm: "bcrypt",
          cost: 10,
        });
      }

      if (dbUser) {
        const updated = await dbUser.update({
          where: { id: userId },
          data: updateData,
        });
        const { password: _, ...userProfile } = updated;
        return userProfile;
      } else {
        const idx = memoryUsers.findIndex((u) => u.id === userId);
        if (idx !== -1 && memoryUsers[idx]) {
          memoryUsers[idx] = { ...memoryUsers[idx]!, ...updateData };
          const { password: _, ...userProfile } = memoryUsers[idx]!;
          return userProfile;
        }
      }
    } catch (err: any) {
      throw err;
    }
  },

  // Categories
  async getCategories() {
    try {
      const dbCategories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      });
      return dbCategories.map((c: any) => ({
        ...c,
        _count: { products: c._count.products },
      }));
    } catch {
      return memoryCategories.map((c) => ({
        ...c,
        _count: {
          products: memoryProducts.filter((p) => p.categoryId === c.id).length,
        },
      }));
    }
  },

  async createCategory(data: { name: string; description?: string }) {
    try {
      const created = await prisma.category.create({ data });
      memoryCategories.push({
        id: created.id,
        name: created.name,
        description: created.description,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      return created;
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("Nama kategori sudah digunakan");
      }
      const existing = memoryCategories.find(
        (c) => c.name.toLowerCase() === data.name.toLowerCase(),
      );
      if (existing) {
        throw new Error("Nama kategori sudah digunakan");
      }
      const newCat: MemoryCategory = {
        id: `cat-${Date.now()}`,
        name: data.name,
        description: data.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryCategories.push(newCat);
      return newCat;
    }
  },

  async updateCategory(
    id: string,
    data: { name?: string; description?: string },
  ) {
    try {
      const dbCategory = await prisma.category.findUnique({ where: { id } });
      if (dbCategory) {
        return await prisma.category.update({ where: { id }, data });
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("Nama kategori sudah digunakan");
      }
      if (err.message && !err.message.includes("Record to update not found")) {
        throw err;
      }
    }

    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    const existing = memoryCategories[idx];
    if (!existing) throw new Error("Category not found");
    memoryCategories[idx] = { ...existing, ...data, updatedAt: new Date() };
    return memoryCategories[idx];
  },

  async deleteCategory(id: string) {
    try {
      const dbCategory = await prisma.category.findUnique({ where: { id } });
      if (dbCategory) {
        return await prisma.category.delete({ where: { id } });
      }
    } catch (err: any) {
      if (
        err.code === "P2003" ||
        (err.message &&
          (err.message.includes("foreign key") ||
            err.message.includes("Foreign key")))
      ) {
        throw new Error(
          "Kategori tidak bisa dihapus karena masih memiliki produk",
        );
      }
      throw new Error(err.message || "Gagal menghapus kategori");
    }

    const idx = memoryCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Category not found");
    const deleted = memoryCategories[idx];
    memoryCategories = memoryCategories.filter((c) => c.id !== id);
    return deleted;
  },

  // Products with Pagination
  async getProducts(params?: {
    search?: string;
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ? Math.max(1, Number(params.page)) : 1;
    const limit = params?.limit ? Math.max(1, Number(params.limit)) : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { sku: { contains: params.search, mode: "insensitive" } },
      ];
    }
    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    try {
      const [products, total] = await prisma.$transaction([
        prisma.product.findMany({
          where,
          include: { category: true },
          orderBy: { name: "asc" },
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);

      return {
        data: products,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      let prods = [...memoryProducts];
      if (params?.search) {
        const q = params.search.toLowerCase();
        prods = prods.filter(
          (p) =>
            p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
        );
      }
      if (params?.categoryId) {
        prods = prods.filter((p) => p.categoryId === params.categoryId);
      }
      const total = prods.length;
      const paginated = prods.slice(skip, skip + limit).map((p) => ({
        ...p,
        category: memoryCategories.find((c) => c.id === p.categoryId) || null,
      }));

      return {
        data: paginated,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }
  },

  async getProductById(id: string) {
    try {
      return await prisma.product.findUnique({
        where: { id },
        include: { category: true },
      });
    } catch {
      const prod = memoryProducts.find((p) => p.id === id);
      if (!prod) return null;
      return {
        ...prod,
        category:
          memoryCategories.find((c) => c.id === prod.categoryId) || null,
      };
    }
  },

  async createProduct(data: {
    sku: string;
    name: string;
    description?: string;
    price: number;
    costPrice?: number;
    stock: number;
    imageUrl?: string;
    categoryId: string;
  }) {
    try {
      const created = await prisma.product.create({ data });
      memoryProducts.push({
        id: created.id,
        sku: created.sku,
        name: created.name,
        description: created.description,
        price: created.price,
        costPrice: created.costPrice,
        stock: created.stock,
        imageUrl: created.imageUrl,
        categoryId: created.categoryId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      return created;
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("SKU produk sudah digunakan");
      }
      const existingSku = memoryProducts.find(
        (p) => p.sku.toLowerCase() === data.sku.toLowerCase(),
      );
      if (existingSku) {
        throw new Error("SKU produk sudah digunakan");
      }
      const newProd: MemoryProduct = {
        id: `prod-${Date.now()}`,
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        price: data.price,
        costPrice: data.costPrice || 0,
        stock: data.stock,
        imageUrl: data.imageUrl || null,
        categoryId: data.categoryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryProducts.push(newProd);
      return newProd;
    }
  },

  async updateProduct(
    id: string,
    data: {
      sku?: string;
      name?: string;
      description?: string;
      price?: number;
      costPrice?: number;
      stock?: number;
      imageUrl?: string;
      categoryId?: string;
    },
  ) {
    try {
      const dbProd = await prisma.product.findUnique({ where: { id } });
      if (dbProd) {
        return await prisma.product.update({ where: { id }, data });
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("SKU produk sudah digunakan");
      }
      if (err.message && !err.message.includes("Record to update not found")) {
        throw err;
      }
    }

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    const existing = memoryProducts[idx];
    if (!existing) throw new Error("Product not found");
    memoryProducts[idx] = { ...existing, ...data, updatedAt: new Date() };
    return memoryProducts[idx];
  },

  async deleteProduct(id: string) {
    try {
      const dbProd = await prisma.product.findUnique({ where: { id } });
      if (dbProd) {
        return await prisma.product.delete({ where: { id } });
      }
    } catch (err: any) {
      if (
        err.code === "P2003" ||
        (err.message &&
          (err.message.includes("foreign key") ||
            err.message.includes("Foreign key")))
      ) {
        throw new Error(
          "Produk tidak bisa dihapus karena memiliki riwayat transaksi",
        );
      }
      throw new Error(err.message || "Gagal menghapus produk");
    }

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    const deleted = memoryProducts[idx];
    memoryProducts = memoryProducts.filter((p) => p.id !== id);
    return deleted;
  },

  // Customers with Pagination
  async getCustomers(params?: { page?: number; limit?: number }) {
    const page = params?.page ? Math.max(1, Number(params.page)) : 1;
    const limit = params?.limit ? Math.max(1, Number(params.limit)) : 20;
    const skip = (page - 1) * limit;

    try {
      const [customers, total] = await prisma.$transaction([
        prisma.customer.findMany({
          orderBy: { name: "asc" },
          skip,
          take: limit,
        }),
        prisma.customer.count(),
      ]);

      return {
        data: customers,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      const total = memoryCustomers.length;
      return {
        data: memoryCustomers.slice(skip, skip + limit),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }
  },

  async createCustomer(data: {
    name: string;
    phone?: string;
    email?: string;
    points?: number;
  }) {
    try {
      return await prisma.customer.create({ data });
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("Nomor telepon atau email pelanggan sudah terdaftar");
      }
      const newCust: MemoryCustomer = {
        id: `cust-${Date.now()}`,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        points: data.points || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryCustomers.push(newCust);
      return newCust;
    }
  },

  async updateCustomer(
    id: string,
    data: { name?: string; phone?: string; email?: string; points?: number },
  ) {
    try {
      const dbCust = await prisma.customer.findUnique({ where: { id } });
      if (dbCust) {
        return await prisma.customer.update({ where: { id }, data });
      }
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new Error("Nomor telepon atau email pelanggan sudah terdaftar");
      }
      if (err.message && !err.message.includes("Record to update not found")) {
        throw err;
      }
    }

    const idx = memoryCustomers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Customer not found");
    const existing = memoryCustomers[idx];
    if (!existing) throw new Error("Customer not found");
    memoryCustomers[idx] = { ...existing, ...data, updatedAt: new Date() };
    return memoryCustomers[idx];
  },

  async deleteCustomer(id: string) {
    try {
      const dbCust = await prisma.customer.findUnique({ where: { id } });
      if (dbCust) {
        return await prisma.customer.delete({ where: { id } });
      }
    } catch (err: any) {
      throw new Error(err.message || "Gagal menghapus pelanggan");
    }

    const idx = memoryCustomers.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Customer not found");
    const deleted = memoryCustomers[idx];
    memoryCustomers = memoryCustomers.filter((c) => c.id !== id);
    return deleted;
  },

  // Transactions / POS Checkout with Pagination
  async getTransactions(params?: { page?: number; limit?: number }) {
    const page = params?.page ? Math.max(1, Number(params.page)) : 1;
    const limit = params?.limit ? Math.max(1, Number(params.limit)) : 20;
    const skip = (page - 1) * limit;

    try {
      const [transactions, total] = await prisma.$transaction([
        prisma.transaction.findMany({
          include: {
            customer: true,
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
            items: { include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.transaction.count(),
      ]);

      return {
        data: transactions,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      const total = memoryTransactions.length;
      return {
        data: memoryTransactions.slice(skip, skip + limit),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }
  },

  async getTransactionById(id: string) {
    try {
      return await prisma.transaction.findUnique({
        where: { id },
        include: {
          customer: true,
          user: {
            select: { id: true, name: true, username: true, role: true },
          },
          items: { include: { product: true } },
        },
      });
    } catch {
      return memoryTransactions.find((t) => t.id === id) || null;
    }
  },

  // Interactive Prisma Transaction with Atomic Stock Decrement & Cashier Tracking
  async createTransaction(payload: {
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    paymentMethod: string;
    paymentAmount: number;
    customerId?: string;
    userId?: string;
    taxAmount?: number;
    discountAmount?: number;
  }) {
    let subtotal = 0;
    for (const item of payload.items) {
      subtotal += item.unitPrice * item.quantity;
    }

    const taxAmount =
      payload.taxAmount ?? Math.round(subtotal * 0.1 * 100) / 100;
    const discountAmount = payload.discountAmount ?? 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    if (payload.paymentAmount < totalAmount) {
      throw new Error(
        `Jumlah pembayaran (Rp ${payload.paymentAmount}) kurang dari total tagihan (Rp ${totalAmount})`,
      );
    }

    const changeAmount = payload.paymentAmount - totalAmount;

    try {
      // Interactive Prisma Transaction for Atomic Execution
      return await prisma.$transaction(async (tx: any) => {
        const invoiceNo = generateInvoiceNumber();
        const itemsToCreate = [];

        // Validate userId exists in PostgreSQL to prevent FK constraint error
        let validUserId: string | null = null;
        if (payload.userId) {
          const dbUser = (tx as any).user;
          if (dbUser) {
            const userExists = await dbUser.findUnique({
              where: { id: payload.userId },
            });
            if (userExists) {
              validUserId = payload.userId;
            }
          }
        }

        // Validate customerId exists in PostgreSQL to prevent FK constraint error
        let validCustomerId: string | null = null;
        if (payload.customerId) {
          const custExists = await tx.customer.findUnique({
            where: { id: payload.customerId },
          });
          if (custExists) {
            validCustomerId = payload.customerId;
          }
        }

        // Atomic Stock Decrement with Stock Condition
        for (const item of payload.items) {
          const prodExists = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!prodExists) {
            throw new Error(`PRODUCT_NOT_IN_DB:${item.productId}`);
          }

          const updatedProduct = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updatedProduct.count === 0) {
            throw new Error(
              `Stok produk '${prodExists.name}' tidak mencukupi (Tersedia: ${prodExists.stock}, Dibutuhkan: ${item.quantity})`,
            );
          }

          const itemSubtotal = item.unitPrice * item.quantity;
          itemsToCreate.push({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: itemSubtotal,
          });
        }

        // Create Transaction record with Cashier tracking (userId)
        const createdTx = await tx.transaction.create({
          data: {
            invoiceNo,
            totalAmount,
            taxAmount,
            discountAmount,
            paymentMethod: payload.paymentMethod || "CASH",
            paymentAmount: payload.paymentAmount,
            changeAmount,
            customerId: validCustomerId,
            userId: validUserId,
            items: {
              create: itemsToCreate,
            },
          },
          include: {
            customer: true,
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
            items: { include: { product: true } },
          },
        });

        // Award Customer Loyalty Points atomically (+1 point per 10,000 IDR)
        if (validCustomerId) {
          const addedPoints = Math.floor(totalAmount / 10000);
          if (addedPoints > 0) {
            await tx.customer.update({
              where: { id: validCustomerId },
              data: { points: { increment: addedPoints } },
            });
          }
        }

        return createdTx;
      });
    } catch (err: any) {
      if (
        err.message &&
        (err.message.includes("Stok") ||
          err.message.includes("Jumlah") ||
          err.message.includes("tidak"))
      ) {
        throw err;
      }

      // Memory Store Fallback
      const invoiceNo = generateInvoiceNumber(memoryTransactions.length + 1);
      const itemsToProcess = [];

      for (const item of payload.items) {
        const prodIdx = memoryProducts.findIndex(
          (p) => p.id === item.productId,
        );
        if (prodIdx === -1 || !memoryProducts[prodIdx]) {
          throw new Error(`Product with ID '${item.productId}' not found`);
        }
        if (memoryProducts[prodIdx]!.stock < item.quantity) {
          throw new Error(
            `Stok produk '${memoryProducts[prodIdx]!.name}' tidak mencukupi`,
          );
        }
        memoryProducts[prodIdx]!.stock -= item.quantity;
        const itemSubtotal = item.unitPrice * item.quantity;
        itemsToProcess.push({
          id: `item-${Date.now()}-${item.productId}`,
          productId: item.productId,
          productName: memoryProducts[prodIdx]!.name,
          product: memoryProducts[prodIdx],
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
        });
      }

      const activeUser = memoryUsers.find((u) => u.id === payload.userId);

      const newTx = {
        id: `tx-${Date.now()}`,
        invoiceNo,
        totalAmount,
        taxAmount,
        discountAmount,
        paymentMethod: payload.paymentMethod || "CASH",
        paymentAmount: payload.paymentAmount,
        changeAmount,
        customerId: payload.customerId || null,
        customer:
          memoryCustomers.find((c) => c.id === payload.customerId) || null,
        userId: payload.userId || null,
        user: activeUser
          ? {
              id: activeUser.id,
              name: activeUser.name,
              username: activeUser.username,
              role: activeUser.role,
            }
          : null,
        createdAt: new Date(),
        items: itemsToProcess,
      };

      if (payload.customerId) {
        const custIdx = memoryCustomers.findIndex(
          (c) => c.id === payload.customerId,
        );
        if (custIdx !== -1 && memoryCustomers[custIdx]) {
          memoryCustomers[custIdx]!.points += Math.floor(totalAmount / 10000);
        }
      }

      memoryTransactions.unshift(newTx);
      return newTx;
    }
  },

  // Sales Report by Date Range
  async getSalesReport(params: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    try {
      const [aggregate, transactions] = await prisma.$transaction([
        prisma.transaction.aggregate({
          where,
          _sum: {
            totalAmount: true,
            taxAmount: true,
            discountAmount: true,
            paymentAmount: true,
          },
          _count: { id: true },
        }),
        prisma.transaction.findMany({
          where,
          include: {
            customer: true,
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
            items: { include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const totalRevenue = aggregate._sum.totalAmount || 0;
      const totalTax = aggregate._sum.taxAmount || 0;
      const totalDiscount = aggregate._sum.discountAmount || 0;
      const totalTransactions = aggregate._count.id || 0;

      const paymentBreakdown: Record<
        string,
        { count: number; amount: number }
      > = {};
      transactions.forEach((tx: any) => {
        const method = tx.paymentMethod || "CASH";
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { count: 0, amount: 0 };
        }
        paymentBreakdown[method]!.count += 1;
        paymentBreakdown[method]!.amount += tx.totalAmount;
      });

      return {
        summary: {
          totalRevenue,
          totalTax,
          totalDiscount,
          totalTransactions,
          averageTransaction:
            totalTransactions > 0
              ? Math.round(totalRevenue / totalTransactions)
              : 0,
        },
        paymentBreakdown,
        transactions,
      };
    } catch {
      const totalRevenue = memoryTransactions.reduce(
        (sum, t) => sum + t.totalAmount,
        0,
      );
      return {
        summary: {
          totalRevenue,
          totalTax: 0,
          totalDiscount: 0,
          totalTransactions: memoryTransactions.length,
          averageTransaction:
            memoryTransactions.length > 0
              ? Math.round(totalRevenue / memoryTransactions.length)
              : 0,
        },
        paymentBreakdown: {
          CASH: { count: memoryTransactions.length, amount: totalRevenue },
        },
        transactions: memoryTransactions,
      };
    }
  },

  // Dashboard Stats Calculation via SQL Aggregation
  async getDashboardStats() {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const [
        salesAggregate,
        totalTransactions,
        totalProducts,
        totalCustomers,
        lowStockProducts,
        recentTransactions,
        categories,
      ] = await Promise.all([
        prisma.transaction.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.transaction.count({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),
        prisma.product.count(),
        prisma.customer.count(),
        prisma.product.findMany({
          where: { stock: { lte: 10 } },
          orderBy: { stock: "asc" },
        }),
        prisma.transaction.findMany({
          take: 5,
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          orderBy: { createdAt: "desc" },
          include: {
            customer: true,
            user: {
              select: { id: true, name: true, username: true, role: true },
            },
            items: { include: { product: true } },
          },
        }),
        prisma.category.findMany({
          include: {
            products: {
              include: {
                transactionItems: {
                  where: {
                    transaction: {
                      createdAt: {
                        gte: startOfDay, // Greater than or equal (>= 00:00:00)
                        lte: endOfDay, // Less than or equal (<= 23:59:59)
                      },
                    },
                  },
                  select: { subtotal: true, quantity: true },
                },
              },
            },
          },
        }),
      ]);

      const totalSalesRevenue = salesAggregate._sum.totalAmount || 0;

      const categoryBreakdown = categories.map((cat: any) => {
        let totalRevenue = 0;
        let totalQty = 0;
        cat.products.forEach((p: any) => {
          p.transactionItems.forEach((ti: any) => {
            totalRevenue += ti.subtotal || 0;
            totalQty += ti.quantity || 0;
          });
        });
        return { name: cat.name, totalRevenue, totalQty };
      });

      return {
        totalSalesRevenue,
        totalTransactions,
        totalProducts,
        totalCustomers,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        categoryBreakdown,
        recentTransactions,
      };
    } catch {
      const totalSalesRevenue = memoryTransactions.reduce(
        (sum: number, t: any) => sum + (t.totalAmount || 0),
        0,
      );
      const lowStockProducts = memoryProducts.filter((p: any) => p.stock <= 10);

      return {
        totalSalesRevenue,
        totalTransactions: memoryTransactions.length,
        totalProducts: memoryProducts.length,
        totalCustomers: memoryCustomers.length,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        categoryBreakdown: memoryCategories.map((c) => ({
          name: c.name,
          totalRevenue: 18000,
          totalQty: 1,
        })),
        recentTransactions: memoryTransactions.slice(0, 5),
      };
    }
  },
};
