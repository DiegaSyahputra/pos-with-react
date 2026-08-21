import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  Search,
  KeyRound,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface UsersManagerProps {
  token?: string;
}

const ITEMS_PER_PAGE = 15;

export const UsersManager: React.FC<UsersManagerProps> = ({ token }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "CASHIER",
  });
  const [modalError, setModalError] = useState<string | null>(null);

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    const controller = new AbortController();
    fetchUsers(controller.signal);
    return () => controller.abort();
  }, []);

  const fetchUsers = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { headers: authHeaders, signal });
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to load users data", err);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      username: "",
      name: "",
      email: "",
      password: "",
      role: "CASHIER",
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({
      username: u.username,
      name: u.name,
      email: u.email || "",
      password: "", // Optional for edit
      role: u.role || "CASHIER",
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (
      !editingId &&
      (!formData.username || !formData.password || !formData.name)
    ) {
      setModalError("Username, nama lengkap, dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchUsers();
      } else {
        setModalError(json.error || "Gagal menyimpan data user");
      }
    } catch {
      setModalError("Terjadi kesalahan jaringan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun user '${username}'?`))
      return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
      } else {
        alert(json.error || "Gagal menghapus user");
      }
    } catch {
      alert("Kesalahan koneksi saat menghapus user");
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }, [users, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / ITEMS_PER_PAGE),
  );
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>Kelola Kasir</span>
          </h2>
          <p className="text-xs text-slate-400">
            Kelola akun kasir Cafe Pandawa, dan autentikasi.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Kasir</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, username, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">Kasir</th>
                <th className="px-4 py-3.5">Username</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5 text-center">Role / Hak Akses</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 w-12 text-center text-xs text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ID: {u.id.substring(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-indigo-300">
                      {u.username}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {u.email || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-extrabold ${
                          u.role === "ADMIN"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{u.role || "CASHIER"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          aria-label={`Edit user ${u.name}`}
                          title="Edit User / Reset Password"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          aria-label={`Hapus user ${u.name}`}
                          title="Hapus User"
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

        {!loading && filteredUsers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}{" "}
              dari {filteredUsers.length} kasir
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

      {/* Modal Add / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setShowModal(false)}
              aria-label="Tutup modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">
              {editingId ? "Ubah Akun Kasir" : "Tambah Akun Kasir"}
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
                  Username Login:
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  placeholder="username..."
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="glass-input w-full text-xs font-mono disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nama Lengkap User:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama pengguna..."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email (Opsional):
                </label>
                <input
                  type="email"
                  placeholder="kasir@toko.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Role / Hak Akses:
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="glass-input w-full text-xs"
                >
                  <option value="CASHIER">CASHIER (Kasir Cafe Pandawa)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {editingId
                    ? "Password Baru (Kosongkan jika tidak diubah):"
                    : "Password Login:"}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required={!editingId}
                    placeholder={
                      editingId
                        ? "Ketik jika ingin reset password..."
                        : "Minimal 6 karakter..."
                    }
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="glass-input w-full pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
