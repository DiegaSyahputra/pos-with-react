import React, { useState } from "react";
import {
  Store,
  Lock,
  User as UserIcon,
  LogIn,
  AlertCircle,
  Sparkles,
  Key,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (json.success && json.token) {
        onLoginSuccess(json.data, json.token);
      } else {
        setError(json.error || "Login gagal, silakan periksa kredensial Anda");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (userType: "admin" | "kasir") => {
    if (userType === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("kasir");
      setPassword("kasir123");
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0b1329] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Glow Effect */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-card max-w-md w-full p-8 relative border border-slate-700/80 shadow-2xl rounded-2xl z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Point of Sale System
          </h1>
          <p className="text-xs text-slate-400">
            Silakan login dengan akun PostgreSQL terenkripsi (Bcrypt & JWT
            Session).
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Username:</span>
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan username (contoh: admin / kasir)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Password:</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input w-full text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              <span>Memverifikasi Password Bcrypt & JWT...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk & Generate JWT Session</span>
              </>
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Keamanan Terjamin: Password Bcrypt Hash & JWT Session Token
          </span>
        </div>

        {/* Quick Demo Login Presets */}
        <div className="pt-3 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400 text-center font-semibold mb-2.5 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Login Cepat (Dari Database Seed):</span>
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-left transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs">
                <Key className="w-3.5 h-3.5" />
                <span>Login Administrator</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                admin / admin123
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin("kasir")}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-left transition cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Login Kasir Toko</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">
                kasir / kasir123
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
