import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateInvoiceNumber } from "../src/lib/invoice-generator";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:@localhost:5432/pos?schema=public";

let prisma: PrismaClient;
try {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} catch {
  prisma = new PrismaClient();
}

async function main() {
  console.log("🌱 Starting POS Database Seeding into Laragon PostgreSQL...");

  // Hash default passwords using Bun.password (Bcrypt)
  const adminPasswordHash = await Bun.password.hash("admin123", { algorithm: "bcrypt", cost: 10 });
  const kasirPasswordHash = await Bun.password.hash("kasir123", { algorithm: "bcrypt", cost: 10 });

  // 1. Create Default Users (Admin & Kasir) with Hashed Passwords
  const dbUser = (prisma as any).user;

  if (dbUser) {
    await dbUser.upsert({
      where: { username: "admin" },
      update: { password: adminPasswordHash },
      create: {
        username: "admin",
        password: adminPasswordHash,
        name: "Administrator POS",
        email: "admin@pos.com",
        role: "ADMIN",
      },
    });

    await dbUser.upsert({
      where: { username: "kasir" },
      update: { password: kasirPasswordHash },
      create: {
        username: "kasir",
        password: kasirPasswordHash,
        name: "Kasir Toko Utama",
        email: "kasir@pos.com",
        role: "CASHIER",
      },
    });

    console.log("✅ Users created with Bcrypt Hashed Passwords!");
  }

  // 2. Create Categories
  const categoryBeverage = await prisma.category.upsert({
    where: { name: "Minuman (Beverages)" },
    update: {},
    create: {
      name: "Minuman (Beverages)",
      description: "Aneka kopi, teh, boba, dan jus segar",
    },
  });

  const categoryFood = await prisma.category.upsert({
    where: { name: "Makanan Utama (Main Course)" },
    update: {},
    create: {
      name: "Makanan Utama (Main Course)",
      description: "Nasi goreng, mie, dan hidangan porsi berat",
    },
  });

  const categorySnack = await prisma.category.upsert({
    where: { name: "Camilan (Snacks)" },
    update: {},
    create: {
      name: "Camilan (Snacks)",
      description: "Kentang goreng, roti bakar, kue, dan pastry",
    },
  });

  console.log("✅ Categories created!");

  // 3. Create Products
  const productsData = [
    {
      sku: "BEV-001",
      name: "Kopi Susu Gula Aren",
      description: "Espresso premium dengan susu segar & gula aren organik",
      price: 18000,
      costPrice: 8000,
      stock: 45,
      imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80",
      categoryId: categoryBeverage.id,
    },
    {
      sku: "BEV-002",
      name: "Matcha Latte Ice",
      description: "Bubuk matcha jepang pilihan dengan fresh milk",
      price: 22000,
      costPrice: 10000,
      stock: 30,
      imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80",
      categoryId: categoryBeverage.id,
    },
    {
      sku: "BEV-003",
      name: "Es Teh Manis Jumbo",
      description: "Teh melati harum porsi besar",
      price: 8000,
      costPrice: 2500,
      stock: 5,
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80",
      categoryId: categoryBeverage.id,
    },
    {
      sku: "FOD-001",
      name: "Nasi Goreng Spesial POS",
      description: "Nasi goreng bumbu rempah dengan telur mata sapi & ayam suwir",
      price: 28000,
      costPrice: 12000,
      stock: 25,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80",
      categoryId: categoryFood.id,
    },
    {
      sku: "FOD-002",
      name: "Mie Goreng Rendang",
      description: "Mie telur tumis dengan potongan daging rendang empuk",
      price: 32000,
      costPrice: 15000,
      stock: 8,
      imageUrl: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=400&q=80",
      categoryId: categoryFood.id,
    },
    {
      sku: "SNK-001",
      name: "French Fries BBQ",
      description: "Kentang renyah tabur bumbu BBQ gurih",
      price: 15000,
      costPrice: 6000,
      stock: 50,
      imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=400&q=80",
      categoryId: categorySnack.id,
    },
    {
      sku: "SNK-002",
      name: "Roti Bakar Cokelat Keju",
      description: "Roti gandum bakar lelehan cokelat belgia & keju cheddar",
      price: 18000,
      costPrice: 7000,
      stock: 3,
      imageUrl: "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bff?auto=format&fit=crop&w=400&q=80",
      categoryId: categorySnack.id,
    },
  ];

  for (const prod of productsData) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: prod,
      create: prod,
    });
  }
  console.log("✅ Products created!");

  // 4. Create Customers
  const customerBudi = await prisma.customer.upsert({
    where: { phone: "081234567890" },
    update: {},
    create: {
      name: "Budi Santoso",
      phone: "081234567890",
      email: "budi.santoso@example.com",
      points: 120,
    },
  });

  await prisma.customer.upsert({
    where: { phone: "089876543210" },
    update: {},
    create: {
      name: "Siti Rahmawati",
      phone: "089876543210",
      email: "siti.rahma@example.com",
      points: 50,
    },
  });

  console.log("✅ Customers created!");

  // 5. Create Initial Transaction
  const p1 = await prisma.product.findUnique({ where: { sku: "BEV-001" } });
  const p2 = await prisma.product.findUnique({ where: { sku: "FOD-001" } });

  if (p1 && p2) {
    const inv1 = generateInvoiceNumber(1);
    const subtotal = p1.price * 2 + p2.price * 1;
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const existingTx = await prisma.transaction.findUnique({ where: { invoiceNo: inv1 } });
    if (!existingTx) {
      await prisma.transaction.create({
        data: {
          invoiceNo: inv1,
          totalAmount: total,
          taxAmount: tax,
          discountAmount: 0,
          paymentMethod: "CASH",
          paymentAmount: 100000,
          changeAmount: 100000 - total,
          customerId: customerBudi.id,
          items: {
            create: [
              {
                productId: p1.id,
                quantity: 2,
                unitPrice: p1.price,
                subtotal: p1.price * 2,
              },
              {
                productId: p2.id,
                quantity: 1,
                unitPrice: p2.price,
                subtotal: p2.price * 1,
              },
            ],
          },
        },
      });
      console.log("✅ Initial demo transaction created!");
    }
  }

  console.log("🎉 Seeding to Laragon PostgreSQL completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
