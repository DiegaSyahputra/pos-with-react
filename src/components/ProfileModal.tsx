import React, { useState } from "react";
import { UserCheck, X, AlertCircle, Check, Lock } from "lucide-react";

interface ProfileModalProps {
  currentUser: any;
  token: string;
  onClose: () => void;
  onProfileUpdated: (updatedUser: any) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  currentUser,
  token,
  onClose,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok");
      return;
    }

    if (newPassword && !oldPassword) {
      setError("Masukkan password saat ini untuk melanjutkan.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          ...(newPassword ? { oldPassword, newPassword } : {}),
        }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccessMsg("Profil Anda berhasil diperbarui!");
        onProfileUpdated(json.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(json.error || "Gagal memperbarui profil");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-6 relative border border-slate-700 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Tutup pengaturan akun"
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Pengaturan Akun</h3>
            <p className="text-xs text-slate-400">
              Perbarui data diri atau perbarui kata sandi akun Anda.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Username
            </label>
            <input
              type="text"
              disabled
              value={`${currentUser?.username || ""}`}
              className="glass-input w-full text-xs font-mono disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Email:
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-9 text-xs"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Ubah Password Akun (Opsional)</span>
            </p>

            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Password Saat Ini (Lama):
              </label>
              <input
                type="password"
                placeholder="Masukkan password lama..."
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="glass-input w-full text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  placeholder="Password baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input w-full text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  placeholder="Ulangi password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input w-full text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
