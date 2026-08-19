import React, { useEffect, useState } from "react";
import { FileText, Eye, Search, Printer, X, Sparkles } from "lucide-react";

interface TransactionsHistoryProps {
  token?: string;
}

export const TransactionsHistory: React.FC<TransactionsHistoryProps> = ({
  token,
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      const json = await res.json();
      if (json.success) setTransactions(json.data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.invoiceNo.toLowerCase().includes(q) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(q)) ||
      t.paymentMethod.toLowerCase().includes(q)
    );
  });

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
            <FileText className="w-6 h-6 text-indigo-400" />
            <span>Riwayat Transaksi Penjualan</span>
          </h2>
          <p className="text-xs text-slate-400">
            Daftar struk transaksi POS kasir, detail item belanja, dan cetak
            ulang struk.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan No Invoice, Pelanggan, atau Metode Bayar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">No Invoice</th>
                <th className="px-4 py-3.5">Tanggal & Waktu</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5 text-center">Metode Bayar</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 text-center">Detail Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada riwayat transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5 font-mono font-semibold text-indigo-300">
                      {tx.invoiceNo}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-200">
                      {tx.customer?.name || "Umum (Walk-in)"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-white">
                      {formatIDR(tx.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <Sparkles className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <h3 className="text-base font-extrabold tracking-wider uppercase text-slate-900">
                POS CAFE & RESTO
              </h3>
              <p className="text-[10px] text-slate-500">
                Struk Pembayaran Penjualan
              </p>
              <p className="text-[10px] text-slate-700 font-bold mt-2">
                {selectedTx.invoiceNo}
              </p>
              <p className="text-[10px] text-slate-500">
                {new Date(selectedTx.createdAt).toLocaleString("id-ID")}
              </p>
              {selectedTx.customer?.name && (
                <p className="text-[10px] text-indigo-600 font-semibold mt-1">
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
                className="mt-4 w-full py-2 bg-slate-900 text-white font-sans font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-800"
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
