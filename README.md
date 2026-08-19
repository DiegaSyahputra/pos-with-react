# Point of Sale (POS) Web Application & Master Data Dashboard

A modern, high-performance **Point of Sale (POS) & Master Data Dashboard** application built with **Bun**, **Elysia.js**, **Prisma ORM**, **PostgreSQL**, **React 19**, and **TypeScript**.

![Stack](https://img.shields.io/badge/Stack-Bun%20%7C%20Elysia.js%20%7C%20Prisma%20%7C%20PostgreSQL-indigo)
![Auth System](https://img.shields.io/badge/Auth-PostgreSQL%20Users%20(Bcrypt%20%2B%20JWT)-purple)
![Testing](https://img.shields.io/badge/Testing-Unit%20%26%20Integration-emerald)

---

## 🚀 Teknologi yang Digunakan (Tech Stack)

- **Backend API**: [Bun](https://bun.sh/) (Runtime) + [Elysia.js](https://elysiajs.com/) (Web Framework)
- **Database & ORM**: PostgreSQL + [Prisma ORM](https://www.prisma.io/) v7 (`@prisma/adapter-pg`)
- **Autentikasi & Keamanan**: Bcrypt Password Hashing (`Bun.password`) + JWT Bearer Token Session (`@elysiajs/jwt`)
- **Role Middleware Guard**: Proteksi hak akses API Master Data (`ADMIN`) & Kasir POS (`CASHIER`)
- **Frontend UI**: React 19 + TypeScript + Clean HTML5 History API Routing + TailwindCSS v4
- **Testing**: Bun Test Runner (`bun test`) untuk Unit Testing & Integration Testing

---

## 🔑 Kredensial Login Default (Dari Seeder Database)

| Username | Password | Role / Hak Akses | Landing Page Default |
|---|---|---|---|
| **`admin`** | **`admin123`** | **`ADMIN`** | `http://localhost:3000/admin/dashboard` |
| **`kasir`** | **`kasir123`** | **`CASHIER`** | `http://localhost:3000/cashier/pos` |

---

## 🛠️ Langkah-Langkah Setup & Instalasi

### 1. Prasyarat System
Pastikan komputer Anda sudah terinstal:
- **Bun** (v1.1+): [https://bun.sh](https://bun.sh)
- **PostgreSQL Database** (Lokal / Laragon / Cloud Postgres)

### 2. Clone Repositori & Instal Dependensi
```bash
git clone <URL_REPOSITORI_ANDA>
cd <NAMA_FOLDER_PROJECT>
bun install
```

### 3. Konfigurasi Environment (`.env`)
Buat file `.env` di root direktori project:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:@localhost:5432/pos?schema=public"
JWT_SECRET="pos-super-secret-jwt-key-2026-production"
```

> [!IMPORTANT]
> **Catatan Keamanan JWT_SECRET**: Nilai `JWT_SECRET` pada contoh `.env` di atas adalah string kunci contoh untuk lingkungan lokal. Untuk server publik / *production*, **WAJIB** mengganti kunci ini dengan string rahasia acak yang kuat (misalnya dibuat dengan perintah: `openssl rand -base64 32`). Jangan gunakan kunci default pada lingkungan produksi!

### 4. Migrasi & Seeding Database
Jalankan perintah berikut untuk membuat struktur tabel database (termasuk tabel `User` dengan password Bcrypt hash) dan memasukkan data demo awal:
```bash
# Push schema ke database PostgreSQL
bun run db:push

# Masukkan data seed awal (User Admin/Kasir, Kategori, Produk, Pelanggan, Transaksi)
bun run seed
```

### 5. Menjalankan Server Aplikasi (Dev Server)
```bash
bun run dev
```
Buka browser Anda di `http://localhost:3000` untuk mengakses antarmuka login & aplikasi POS.

---

## 📖 Dokumentasi API & Middleware Authentication

Setiap endpoint API perubahan data (*POST, PUT, DELETE*) pada Master Data memerlukan header otentikasi:
`Authorization: Bearer <JWT_TOKEN>`

### 1. Authentication Endpoints
| Method | Endpoint | Authorization Header | Payload Body | Deskripsi |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | None | `{ "username": "admin", "password": "admin123" }` | Memverifikasi Bcrypt hash & mengembalikan JWT Bearer token |
| `GET` | `/api/auth/me` | `Bearer <TOKEN>` | None | Memverifikasi sesi JWT Token & mengembalikan profil aktif |
| `GET` | `/api/auth/users` | None | None | Mengambil daftar akun pengguna |

### 2. Dashboard Endpoint
| Method | Endpoint | Authorization Header | Deskripsi |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | None | Mengambil ringkasan metrik KPI dashboard, stok tipis, dan transaksi terbaru |

### 3. Categories Master Endpoints (Protected: Admin Only)
| Method | Endpoint | Authorization Header | Payload Body | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/categories` | Optional | None | Mengambil daftar semua kategori |
| `POST` | `/api/categories` | `Bearer <ADMIN_TOKEN>` | `{ "name": "Minuman", "description": "Kopi & teh" }` | Membuat kategori baru |
| `PUT` | `/api/categories/:id` | `Bearer <ADMIN_TOKEN>` | `{ "name": "Minuman Update" }` | Memperbarui data kategori |
| `DELETE` | `/api/categories/:id` | `Bearer <ADMIN_TOKEN>` | None | Menghapus data kategori |

### 4. Products Master Endpoints (Protected: Admin Only)
| Method | Endpoint | Authorization Header | Payload Body | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/products` | Optional | Query: `?search=...&categoryId=...` | Mengambil daftar produk (dengan pencarian) |
| `GET` | `/api/products/:id` | Optional | None | Mengambil detail 1 produk |
| `POST` | `/api/products` | `Bearer <ADMIN_TOKEN>` | `{ "sku": "BEV-001", "name": "Kopi Susu", "price": 18000, "stock": 50, "categoryId": "..." }` | Menambah produk baru |
| `PUT` | `/api/products/:id` | `Bearer <ADMIN_TOKEN>` | `{ "price": 20000, "stock": 45 }` | Memperbarui data produk |
| `DELETE` | `/api/products/:id` | `Bearer <ADMIN_TOKEN>` | None | Menghapus produk (Ditolak jika memuat riwayat struk) |

### 5. Customers Master Endpoints
| Method | Endpoint | Authorization Header | Payload Body | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/customers` | Optional | None | Mengambil daftar pelanggan & poin loyalitas |
| `POST` | `/api/customers` | Optional | `{ "name": "Budi", "phone": "08123456789", "email": "budi@mail.com" }` | Mendaftarkan pelanggan baru |
| `PUT` | `/api/customers/:id` | Optional | `{ "points": 150 }` | Memperbarui profil pelanggan |
| `DELETE` | `/api/customers/:id` | Optional | None | Menghapus data pelanggan |

### 6. Transactions / POS Checkout Endpoints
| Method | Endpoint | Authorization Header | Payload Body | Deskripsi |
|---|---|---|---|---|
| `GET` | `/api/transactions` | Optional | None | Mengambil daftar riwayat transaksi penjualan |
| `GET` | `/api/transactions/:id` | Optional | None | Mengambil rincian item struk transaksi tertentu |
| `POST` | `/api/transactions` | Optional | `{ "items": [{"productId": "...", "quantity": 2, "unitPrice": 18000}], "paymentMethod": "CASH", "paymentAmount": 50000, "customerId": "..." }` | Memproses transaksi POS checkout & memotong stok otomatis |

---

## 🧪 Tugas Pengujian (Testing Tasks)

Jalankan pengujian otomatis (**Unit Testing** dan **Integration Testing**):
```bash
bun test
```
