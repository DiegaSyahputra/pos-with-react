import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, FolderPlus, X, AlertCircle } from "lucide-react";

interface CategoriesManagerProps {
  token?: string;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  token,
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [modalError, setModalError] = useState<string | null>(null);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories", { headers: authHeaders });
      const json = await res.json();
      if (json.success) setCategories(json.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({ name: "", description: "" });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.name.trim()) {
      setModalError("Nama kategori wajib diisi");
      return;
    }

    try {
      const url = editingId
        ? `/api/categories/${editingId}`
        : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchCategories();
      } else {
        setModalError(json.error || "Gagal menyimpan kategori");
      }
    } catch (err) {
      setModalError("Terjadi kesalahan koneksi");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori '${name}'?`)) return;

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.success) {
        fetchCategories();
      } else {
        alert(json.error || "Gagal menghapus kategori");
      }
    } catch (err) {
      alert("Kesalahan koneksi saat menghapus");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-6 h-6 text-indigo-400" />
            <span>Kategori Produk</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kelola kelompok menu untuk mempermudah transaksi penjualan.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Kategori</span>
        </button>
      </div>

      {/* Categories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Memuat kategori...
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Belum ada data kategori yang dibuat.
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-card p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-white">{cat.name}</h4>
                  <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-full">
                    {cat._count?.products || 0} Produk
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {cat.description || "Tidak ada deskripsi."}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? "Ubah Kategori" : "Kategori Baru"}
            </h3>

            {modalError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Kategori:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Makanan Utama, Minuman..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Deskripsi Kategori:
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan atau detail kelompok menu (opsional)"
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
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
