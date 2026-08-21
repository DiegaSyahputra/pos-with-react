import React, { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Printer,
  DollarSign,
  ShoppingCart,
  CreditCard,
  UserCheck,
  TrendingUp,
  Filter,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SalesReportProps {
  token?: string;
}

const ITEMS_PER_PAGE = 15;

export const SalesReport: React.FC<SalesReportProps> = ({ token }) => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activePreset, setActivePreset] = useState<
    "today" | "7days" | "30days" | "month" | "custom"
  >("today");
  // const [activePreset, setActivePreset] = useState;
  // "today" | "7days" | "30days" | "month" | ("custom" > "today");

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  useEffect(() => {
    const controller = new AbortController();
    const todayStr = new Date().toISOString().split("T")[0]!;
    setStartDate(todayStr);
    setEndDate(todayStr);
    fetchReport(todayStr, todayStr, controller.signal);
    return () => controller.abort();
  }, []);

  const fetchReport = async (
    start?: string,
    end?: string,
    signal?: AbortSignal,
  ) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (start) queryParams.append("startDate", start);
      if (end) queryParams.append("endDate", end);

      const res = await fetch(`/api/reports/sales?${queryParams.toString()}`, {
        headers: authHeaders,
        signal,
      });
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
        setCurrentPage(1);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Failed to load sales report", err);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(startDate, endDate);
  };

  const handlePresetDate = (type: "today" | "7days" | "30days" | "month") => {
    setActivePreset(type);
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

  // Fix bug: field CSV (nama pelanggan/kasir) yang mengandung koma,
  // kutip, atau baris baru akan merusak struktur CSV kalau tidak
  // di-escape. Sekarang setiap field dibungkus tanda kutip dan tanda
  // kutip di dalamnya digandakan sesuai standar CSV (RFC 4180).
  const escapeCsvField = (value: any) => {
    const str = String(value ?? "");
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    if (!reportData || !reportData.transactions) return;

    const headers = [
      "Invoice No",
      "Tanggal & Waktu",
      "Kasir/User",
      "Pelanggan",
      "Metode Bayar",
      "Pajak (Rp)",
      "Diskon (Rp)",
      "Total Tagihan (Rp)",
    ];
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

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row: any[]) => row.map(escapeCsvField).join(","))
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Laporan_Penjualan_${startDate}_sd_${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const summary = reportData?.summary || {
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    totalTax: 0,
    totalDiscount: 0,
  };
  const breakdown = reportData?.paymentBreakdown || {};
  const transactions = reportData?.transactions || [];

  // Pagination sisi klien — rentang tanggal panjang (30 hari/bulan ini)
  // bisa menghasilkan ratusan baris transaksi.
  const totalPages = Math.max(
    1,
    Math.ceil(transactions.length / ITEMS_PER_PAGE),
  );
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(start, start + ITEMS_PER_PAGE);
  }, [transactions, currentPage]);

  const presets = [
    { id: "today", label: "Hari Ini" },
    { id: "7days", label: "7 Hari Terakhir" },
    { id: "30days", label: "30 Hari Terakhir" },
    { id: "month", label: "Bulan Ini" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <span>Laporan Penjualan</span>
          </h2>
          <p className="text-xs text-slate-400">
            Pantau ringkasan omset, metode pembayaran, dan riwayat transaksi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
            Rentang Waktu:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {presets.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetDate(p.id)}
                  disabled={loading}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ease-in-out cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 border border-indigo-400/30 font-bold"
                      : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 scale-100 border border-slate-700/50"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <form
          onSubmit={handleApplyFilter}
          className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset("custom");
              }}
              className="glass-input px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset("custom");
              }}
              className="glass-input px-3 py-1.5 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Terapkan Filter</span>
          </button>

          <button
            type="button"
            onClick={() => fetchReport(startDate, endDate)}
            disabled={loading}
            aria-label="Muat ulang data laporan"
            title="Refresh Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </form>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Total Penjualan
            </p>
            <p className="text-2xl font-black text-white mt-1">
              Rp {summary.totalRevenue.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Total Transaksi
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {summary.totalTransactions} Struk
            </p>
          </div>
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-purple-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Rata-rata Transaksi
            </p>
            <p className="text-2xl font-black text-white mt-1">
              Rp {summary.averageTransaction.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-5 border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              Pajak Terkumpul
            </p>
            <p className="text-2xl font-black text-white mt-1">
              Rp {summary.totalTax.toLocaleString("id-ID")}
            </p>
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
          <span> Metode Pembayaran</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.keys(breakdown).length === 0 ? (
            <p className="text-xs text-slate-500 col-span-4">
              Belum ada transaksi pada periode ini.
            </p>
          ) : (
            Object.entries(breakdown).map(([method, val]: any) => (
              <div
                key={method}
                className="bg-slate-900/60 p-3 rounded-xl border border-slate-800"
              >
                <p className="text-[11px] font-bold text-indigo-500 uppercase">
                  {method}
                </p>
                <p className="text-base font-bold text-white mt-0.5">
                  Rp {val.amount.toLocaleString("id-ID")}
                </p>
                <p className="text-[10px] text-slate-400">
                  {val.count} Transaksi
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transactions Table with Cashier Name & Struk Detail */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-bold text-white">Riwayat Transaksi</h3>
          <span className="text-xs text-slate-400 font-mono">
            Total {transactions.length} baris
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 w-10 text-center">No</th>
                <th className="px-4 py-3">No Invoice</th>
                <th className="px-4 py-3">Tanggal & Waktu</th>
                <th className="px-4 py-3">Kasir</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3 text-center">Metode</th>
                <th className="px-4 py-3 text-right">Total (Rp)</th>
                <th className="px-4 py-3 text-center">Detail Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Memuat laporan penjualan...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    Belum ada transaksi pada periode ini.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx: any, index: number) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 w-10 text-center text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-500">
                      {tx.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(tx.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{tx.user ? tx.user.name : "System"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {tx.customer ? tx.customer.name : "Pelanggan Umum"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      Rp {tx.totalAmount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        aria-label={`Lihat detail struk ${tx.invoiceNo}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1.5 mx-auto border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-200"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Lihat</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800 text-xs text-slate-400">
            <span>
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, transactions.length)} dari{" "}
              {transactions.length} transaksi
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

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white text-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl relative font-mono text-xs animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTx(null)}
              aria-label="Tutup detail struk"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <Sparkles className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <h3 className="text-base font-extrabold tracking-wider uppercase text-slate-900">
                CAFE PANDAWA
              </h3>
              <p className="text-[10px] text-slate-500">Struk Penjualan</p>
              <p className="text-[10px] text-slate-700 font-bold mt-2">
                {selectedTx.invoiceNo}
              </p>
              <p className="text-[10px] text-slate-500">
                {new Date(selectedTx.createdAt).toLocaleString("id-ID")}
              </p>
              {selectedTx.user?.name && (
                <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                  Kasir: {selectedTx.user.name}
                </p>
              )}
              {selectedTx.customer?.name && (
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                  Pelanggan: {selectedTx.customer.name}
                </p>
              )}
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
              {selectedTx.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {item.product?.name || item.productName || "Produk"} (x
                    {item.quantity})
                  </span>
                  <span className="font-bold">{formatIDR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="py-3 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Pajak (10%)</span>
                <span>{formatIDR(selectedTx.taxAmount)}</span>
              </div>
              {selectedTx.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon</span>
                  <span>-{formatIDR(selectedTx.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200 text-slate-900">
                <span>TOTAL AKHIR</span>
                <span>{formatIDR(selectedTx.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>METODE BAYAR</span>
                <span>{selectedTx.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>UANG DITERIMA</span>
                <span>{formatIDR(selectedTx.paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>KEMBALIAN</span>
                <span>{formatIDR(selectedTx.changeAmount)}</span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <p>Terima kasih atas kunjungan Anda!</p>
              <button
                onClick={() => window.print()}
                className="mt-4 w-full py-2 bg-slate-900 text-white font-sans font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
