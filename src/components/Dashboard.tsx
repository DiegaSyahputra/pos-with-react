import React, { useCallback, useEffect, useState } from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ChevronRight,
} from "lucide-react";

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
  token?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateTab,
  token,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const res = await fetch("/api/dashboard/stats", { headers: authHeaders });
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
      } else {
        setError(json.error || "Failed to load dashboard stats");
      }
    } catch {
      setError("Network error fetching dashboard stats");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-slate-400 font-medium">Memuat data Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <span>Point of Sale Dashboard</span>
            <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold">
              Live Realtime
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Ringkasan performa penjualan master data, inventaris stok, dan
            transaksi POS kasir.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab("pos")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Buka Kasir POS</span>
          </button>
          <button
            onClick={fetchStats}
            title="Refresh Data"
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={fetchStats}
            className="underline font-semibold cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Pendapatan */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Pendapatan
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {formatIDR(stats?.totalSalesRevenue)}
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Semua Transaksi POS</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Total Transaksi */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Transaksi
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {stats?.totalTransactions || 0}{" "}
                <span className="text-sm font-normal text-slate-400">
                  struk
                </span>
              </h3>
              <p className="text-xs text-indigo-400 flex items-center gap-1 mt-2 font-medium">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Selesai diproses</span>
              </p>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Total Produk Master */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Master Produk
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {stats?.totalProducts || 0}{" "}
                <span className="text-sm font-normal text-slate-400">item</span>
              </h3>
              <button
                onClick={() => onNavigateTab("products")}
                className="text-xs text-cyan-400 flex items-center gap-1 mt-2 font-medium hover:underline cursor-pointer"
              >
                <span>Kelola Produk</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Stok Tipis Alert */}
        <div className="glass-card glass-card-hover p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Peringatan Stok Tipis
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {stats?.lowStockCount || 0}{" "}
                <span className="text-sm font-normal text-slate-400">
                  produk
                </span>
              </h3>
              <button
                onClick={() => onNavigateTab("products")}
                className="text-xs text-amber-400 flex items-center gap-1 mt-2 font-medium hover:underline cursor-pointer"
              >
                <span>Periksa Stok (≤ 10)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Main Content Grid: Low Stock Alert & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">
                Distribusi Penjualan per Kategori
              </h3>
              <p className="text-xs text-slate-400">
                Performa kontribusi omset per kategori produk
              </p>
            </div>
            <button
              onClick={() => onNavigateTab("categories")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Master Kategori</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {stats?.categoryBreakdown?.map((cat: any, idx: number) => {
              const maxRevenue = Math.max(
                ...stats.categoryBreakdown.map((c: any) => c.totalRevenue),
                1,
              );
              const percent = Math.round((cat.totalRevenue / maxRevenue) * 100);

              const colors = [
                "from-emerald-500 to-teal-400",
                "from-indigo-500 to-purple-400",
                "from-cyan-500 to-blue-400",
                "from-amber-500 to-orange-400",
              ];

              return (
                <div
                  key={idx}
                  className="space-y-1.5 bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-200">
                      {cat.name}
                    </span>
                    <div className="text-right">
                      <span className="font-bold text-white">
                        {formatIDR(cat.totalRevenue)}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        ({cat.totalQty} terjual)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${colors[idx % colors.length]} transition-all duration-500`}
                      style={{ width: `${Math.max(percent, 8)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Warning Sidebar (1 Col) */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">
                Stok Perlu Diisi Ulang
              </h3>
            </div>

            {stats?.lowStockProducts?.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30 text-emerald-400" />
                <p className="text-sm">
                  Semua stok produk dalam kondisi aman (＞ 10)!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {stats?.lowStockProducts?.map((prod: any) => (
                  <div
                    key={prod.id}
                    className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {prod.name}
                      </p>
                      <p className="text-xs text-slate-400">SKU: {prod.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg">
                        Sisa {prod.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab("products")}
            className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <span>Update Stok di Master Produk</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Transaksi Terakhir</span>
            </h3>
            <p className="text-xs text-slate-400">
              5 Struk Penjualan Terkini dari Kasir POS
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("transactions")}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Semua Riwayat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">No Invoice</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Metode Bayar</th>
                <th className="px-4 py-3 text-right">Total Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats?.recentTransactions?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Belum ada transaksi POS yang tercatat hari ini.
                  </td>
                </tr>
              ) : (
                stats?.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-300">
                      {tx.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {tx.customer?.name || "Umum (Walk-in)"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white">
                      {formatIDR(tx.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
