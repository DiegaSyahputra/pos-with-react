import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Printer, Calendar, DollarSign, ShoppingCart, CreditCard, UserCheck, TrendingUp, Filter, RefreshCw } from "lucide-react";

interface SalesReportProps {
  token?: string;
}

export const SalesReport: React.FC<SalesReportProps> = ({ token }) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    // Default filter to Today
    const todayStr = new Date().toISOString().split("T")[0]!;
    setStartDate(todayStr);
    setEndDate(todayStr);
    fetchReport(todayStr, todayStr);
  }, []);

  const fetchReport = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (start) queryParams.append("startDate", start);
      if (end) queryParams.append("endDate", end);

      const res = await fetch(`/api/reports/sales?${queryParams.toString()}`, { headers: authHeaders });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error("Failed to load sales report", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(startDate, endDate);
  };

  const handlePresetDate = (type: "today" | "7days" | "30days" | "month") => {
    const end = new Date();
    const start = new Date();

    if (type === "today") {
      // today is default
    } else if (type === "7days") {
      start.setDate(end.getDate() - 7);
    } else if (type === "30days") {
      start.setDate(end.getDate() - 30);
    } else if (type === "month") {
      start.setDate(1);
    }

    const startStr = start.toISOString().split("T")[0]!;
    const endStr = end.toISOString().split("T")[0]!;

    setStartDate(startStr);
    setEndDate(endStr);
    fetchReport(startStr, endStr);
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.transactions) return;

    const headers = ["Invoice No", "Tanggal & Waktu", "Kasir/User", "Pelanggan", "Metode Bayar", "Pajak (Rp)", "Diskon (Rp)", "Total Tagihan (Rp)"];
    const rows = reportData.transactions.map((tx: any) => [
      tx.invoiceNo,
      new Date(tx.createdAt).toLocaleString("id-ID"),
      tx.user ? tx.user.name : "System",
      tx.customer ? tx.customer.name : "Umum",
      tx.paymentMethod,
      tx.taxAmount || 0,
      tx.discountAmount || 0,
      tx.totalAmount || 0,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Penjualan_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0, totalTax: 0, totalDiscount: 0 };
  const breakdown = reportData?.paymentBreakdown || {};
  const transactions = reportData?.transactions || [];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <span>Laporan Penjualan POS</span>
          </h2>
          <p className="text-xs text-slate-400">Analisis omset harian/rentang tanggal, metode pembayaran, dan jejak kasir.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Presets */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Preset Rentang:</span>
          <button onClick={() => handlePresetDate("today")} className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs rounded-lg border border-indigo-500/30 transition">Hari Ini</button>
          <button onClick={() => handlePresetDate("7days")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition">7 Hari Terakhir</button>
          <button onClick={() => handlePresetDate("30days")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition">30 Hari Terakhir</button>
          <button onClick={() => handlePresetDate("month")} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition">Bulan Ini</button>
        </div>

        <form onSubmit={handleApplyFilter} className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input px-3 py-1.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Terapkan Filter</span>
          </button>

          <button
            type="button"
            onClick={() => fetchReport(startDate, endDate)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            title="Refresh Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Omset Penjualan</p>
            <p className="text-2xl font-black text-white mt-1">Rp {summary.totalRevenue.toLocaleString("id-ID")}</p>
          </div>
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Total Struk Transaksi</p>
            <p className="text-2xl font-black text-white mt-1">{summary.totalTransactions} Struk</p>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Rata-rata Nilai Struk</p>
            <p className="text-2xl font-black text-white mt-1">Rp {summary.averageTransaction.toLocaleString("id-ID")}</p>
          </div>
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">Pajak Terkumpul</p>
            <p className="text-2xl font-black text-white mt-1">Rp {summary.totalTax.toLocaleString("id-ID")}</p>
          </div>
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-400" />
          <span>Rincian Berdasarkan Metode Pembayaran</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.keys(breakdown).length === 0 ? (
            <p className="text-xs text-slate-500 col-span-4">Belum ada transaksi pada periode ini.</p>
          ) : (
            Object.entries(breakdown).map(([method, val]: any) => (
              <div key={method} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <p className="text-[11px] font-bold text-indigo-300 uppercase">{method}</p>
                <p className="text-base font-bold text-white mt-0.5">Rp {val.amount.toLocaleString("id-ID")}</p>
                <p className="text-[10px] text-slate-400">{val.count} Transaksi</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transactions Table with Cashier Name */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">Rincian Transaksi Struk</h3>
          <span className="text-xs text-slate-400 font-mono">Total {transactions.length} baris</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">No Invoice</th>
                <th className="px-4 py-3">Tanggal & Waktu</th>
                <th className="px-4 py-3">Kasir (User)</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3 text-center">Metode</th>
                <th className="px-4 py-3 text-right">Total (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Memuat laporan penjualan...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Tidak ada transaksi ditemukan pada rentang tanggal ini.</td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-300">{tx.invoiceNo}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(tx.createdAt).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{tx.user ? tx.user.name : "System"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{tx.customer ? tx.customer.name : "Pelanggan Umum"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      Rp {tx.totalAmount.toLocaleString("id-ID")}
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
