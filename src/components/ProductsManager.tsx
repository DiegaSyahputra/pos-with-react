import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ProductsManagerProps {
  token?: string;
}

const ITEMS_PER_PAGE = 15;

export const ProductsManager: React.FC<ProductsManagerProps> = ({ token }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    price: 0,
    costPrice: 0,
    stock: 0,
    imageUrl: "",
    categoryId: "",
  });
  const [modalError, setModalError] = useState<string | null>(null);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [resP, resC] = await Promise.all([
        fetch("/api/products", { headers: authHeaders, signal }),
        fetch("/api/categories", { headers: authHeaders, signal }),
      ]);
      const dataP = await resP.json();
      const dataC = await resC.json();

      if (dataP.success) setProducts(dataP.data);
      if (dataC.success) setCategories(dataC.data);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to load products master data", err);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      description: "",
      price: 15000,
      costPrice: 7000,
      stock: 20,
      imageUrl: "",
      categoryId: categories[0]?.id || "",
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description || "",
      price: product.price,
      costPrice: product.costPrice || 0,
      stock: product.stock,
      imageUrl: product.imageUrl || "",
      categoryId: product.categoryId,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name || !formData.sku || !formData.categoryId) {
      setModalError("SKU, Nama Produk, dan Kategori wajib diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchData();
      } else {
        setModalError(json.error || "Gagal menyimpan produk");
      }
    } catch (err: any) {
      setModalError("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk '${name}'?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || "Gagal menghapus produk");
      }
    } catch (err) {
      alert("Kesalahan koneksi saat menghapus");
    }
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = !selectedCategory || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset ke halaman 1 setiap kali filter berubah, supaya tidak
  // "nyangkut" di halaman kosong.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            <span>Katalog Produk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kelola harga, stok, dan rincian barang cafe disini.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Produk</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 text-sm"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="glass-input w-full text-xs"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">Nama Produk</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5 text-right">Harga Jual</th>
                <th className="px-4 py-3.5 text-center">Stok</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Memuat data produk...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    Produk tidak ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod, index) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="px-4 py-3.5 text-center text-xs text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-indigo-300">
                      {prod.sku}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {prod.name}
                          </p>
                          {prod.description && (
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {prod.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-300">
                      <span className="px-2.5 py-1 bg-slate-800 rounded-md border border-slate-700">
                        {prod.category?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-400">
                      {formatIDR(prod.price)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          prod.stock <= 0
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : prod.stock <= 10
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        Stok Habis
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          aria-label={`Ubah produk ${prod.name}`}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          aria-label={`Hapus produk ${prod.name}`}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari{" "}
              {filtered.length} produk
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-lg transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Halaman berikutnya"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-lg transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              aria-label="Tutup modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? "Ubah Produk" : "Tambah Produk Baru"}
            </h3>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kode SKU:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="glass-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Kategori:
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="glass-input w-full text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Produk:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Harga Jual (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="glass-input w-full text-xs font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Harga Beli (Rp):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="glass-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Jumlah Stok:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: Number(e.target.value),
                      })
                    }
                    className="glass-input w-full text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  URL Gambar Produk (Opsional):
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi Produk:
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
