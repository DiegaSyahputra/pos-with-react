import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  CheckCircle,
  Printer,
  X,
  AlertCircle,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  calculateSubtotal,
  calculateTax,
  calculateDiscount,
  calculateTotal,
  calculateChange,
} from "../lib/pos-calculator";

export interface CartItem {
  product: any;
  quantity: number;
  unitPrice: number;
}

interface POSCashierProps {
  token?: string;
  currentUser?: any;
}

// Berapa banyak produk yang ditampilkan per "batch" di grid katalog.
// Dipakai bareng tombol "Muat Lebih Banyak" di bawah grid — bukan
// pager bernomor, supaya kasir tidak perlu berpindah halaman
// sementara pelanggan menunggu di depan mesin kasir.
const PRODUCTS_PER_PAGE = 24;

export const POSCashier: React.FC<POSCashierProps> = ({
  token,
  currentUser,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(PRODUCTS_PER_PAGE);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Notifikasi kecil untuk aksi di panel katalog/keranjang (stok habis,
  // keranjang kosong, dst). Menggantikan alert() browser yang memblokir
  // layar dan tidak konsisten dengan gaya banner error di modal pembayaran.
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const showCartNotice = (message: string) => {
    setCartNotice(message);
    window.clearTimeout((showCartNotice as any)._t);
    (showCartNotice as any)._t = window.setTimeout(
      () => setCartNotice(null),
      3500,
    );
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Reset ke batch pertama setiap kali pencarian/kategori berubah,
  // supaya hasil filter baru selalu mulai dari atas.
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [searchQuery, selectedCategory]);

  const fetchInitialData = async () => {
    try {
      const [resProd, resCat, resCust] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
        fetch("/api/customers"),
      ]);
      const dataProd = await resProd.json();
      const dataCat = await resCat.json();
      const dataCust = await resCust.json();

      if (dataProd.success) setProducts(dataProd.data);
      if (dataCat.success) setCategories(dataCat.data);
      if (dataCust.success) setCustomers(dataCust.data);
    } catch (err) {
      console.error("Failed to load POS data", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );
  const hasMoreProducts = visibleCount < filteredProducts.length;

  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      showCartNotice(`Stok produk '${product.name}' sedang kosong!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showCartNotice(
            `Stok maksimal untuk '${product.name}' adalah ${product.stock}`,
          );
          return prev;
        }
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...prev, { product, quantity: 1, unitPrice: product.price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.quantity + delta;
            if (newQty > i.product.stock) {
              showCartNotice(
                `Stok maksimal untuk '${i.product.name}' adalah ${i.product.stock}`,
              );
              return i;
            }
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = calculateSubtotal(
    cart.map((i) => ({ price: i.unitPrice, quantity: i.quantity })),
  );
  const taxAmount = calculateTax(subtotal, 10);
  const discountAmount = calculateDiscount(subtotal, discountPercent);
  const grandTotal = calculateTotal(subtotal, taxAmount, discountAmount);
  const changeAmount = calculateChange(grandTotal, paymentAmount);

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      showCartNotice("Keranjang belanja masih kosong!");
      return;
    }
    setPaymentAmount(grandTotal);
    setErrorMessage(null);
    setShowPaymentModal(true);
  };

  const handleProcessCheckout = async () => {
    if (paymentAmount < grandTotal && paymentMethod === "CASH") {
      setErrorMessage(
        `Jumlah pembayaran (Rp ${paymentAmount.toLocaleString("id-ID")}) kurang dari total (Rp ${grandTotal.toLocaleString("id-ID")})`,
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const activeToken = token || localStorage.getItem("pos_jwt_token") || "";
      let activeUserId = currentUser?.id;
      if (!activeUserId) {
        const savedUser = localStorage.getItem("pos_user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            activeUserId = parsed?.id;
          } catch {}
        }
      }

      const payload = {
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        paymentMethod,
        paymentAmount: paymentMethod === "CASH" ? paymentAmount : grandTotal,
        customerId: selectedCustomer || undefined,
        userId: activeUserId || undefined,
        taxAmount,
        discountAmount,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (activeToken) {
        headers["Authorization"] = `Bearer ${activeToken}`;
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        setReceiptData(json.data);
        setShowPaymentModal(false);
        setCart([]);
        setDiscountPercent(0);
        setSelectedCustomer("");
        fetchInitialData(); // Refresh product stock
      } else {
        setErrorMessage(json.error || "Gagal memproses transaksi");
      }
    } catch (err: any) {
      setErrorMessage("Terjadi kesalahan jaringan saat memproses checkout");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Left 2 Columns: Product Catalog */}
      <div className="lg:col-span-2 flex flex-col space-y-4 h-full overflow-hidden">
        {/* Search & Category Filter Bar */}
        <div className="glass-card p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari item / kode SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9 text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === ""
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Semua ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Notifikasi kecil pengganti alert() browser */}
        {cartNotice && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cartNotice}</span>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="glass-card p-12 text-center text-slate-400 h-full flex flex-col items-center justify-center">
              <Search className="w-12 h-12 mb-3 text-slate-600 opacity-40" />
              <p className="font-semibold text-lg">Item tidak ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">
                Kata kunci atau kategori yang dicari tidak sesuai.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 10;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`glass-card glass-card-hover p-3.5 flex flex-col justify-between relative group cursor-pointer border ${
                        isOutOfStock
                          ? "opacity-60 cursor-not-allowed border-red-500/20"
                          : "border-slate-800"
                      }`}
                    >
                      <div>
                        {/* Product Image / Placeholder */}
                        <div className="w-full h-28 bg-slate-900/60 rounded-xl overflow-hidden mb-3 relative">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                              No Image
                            </div>
                          )}
                          {/* Stock Badges */}
                          {isOutOfStock ? (
                            <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="absolute top-2 right-2 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                              Sisa {product.stock}
                            </span>
                          ) : (
                            <span className="absolute top-2 right-2 bg-slate-900/80 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-700">
                              Stok: {product.stock}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100 mt-1 line-clamp-1 group-hover:text-indigo-300 transition">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">
                          {formatIDR(product.price)}
                        </span>
                        <button
                          disabled={isOutOfStock}
                          className={`p-1.5 rounded-lg text-white transition ${
                            isOutOfStock
                              ? "bg-slate-800 text-slate-600"
                              : "bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20"
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination: "Muat Lebih Banyak" — dipilih daripada pager
                  bernomor supaya kasir tidak perlu ganti halaman sambil
                  melayani pelanggan. Pencarian & filter kategori tetap
                  instan tanpa memuat ulang batch. */}
              {hasMoreProducts && (
                <div className="flex flex-col items-center gap-2 py-6">
                  <p className="text-[11px] text-slate-500">
                    Menampilkan {visibleProducts.length} dari{" "}
                    {filteredProducts.length} produk
                  </p>
                  <button
                    onClick={() =>
                      setVisibleCount((c) => c + PRODUCTS_PER_PAGE)
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Muat Lebih Banyak</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Column: POS Cart & Checkout */}
      <div className="glass-card p-5 flex flex-col justify-between h-full border border-indigo-500/20">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg text-white">Menu Terpilih</h3>
            </div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-bold">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Item
            </span>
          </div>

          {/* Customer Selection */}
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pilih Pelanggan (Opsional):</span>
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="glass-input w-full text-xs"
            >
              <option value="">-- Umum / Non-Member --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || "No Phone"}) - {c.points} pts
                </option>
              ))}
            </select>
          </div>

          {/* Cart Items List */}
          <div className="mt-4 space-y-3 max-h-[calc(100vh-420px)] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>Belum ada item yang dipilih</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800"
                >
                  <div className="flex-1 pr-2">
                    <h5 className="font-semibold text-xs text-slate-200 line-clamp-1">
                      {item.product.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatIDR(item.unitPrice)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-red-400 hover:text-red-300 ml-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calculation Summary & Checkout Action */}
        <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span className="font-medium text-slate-200">
              {formatIDR(subtotal)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>Diskon (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={discountPercent}
              onChange={(e) =>
                setDiscountPercent(
                  Math.max(0, Math.min(100, Number(e.target.value))),
                )
              }
              className="w-16 glass-input py-0.5 px-2 text-right text-xs"
            />
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>Diskon</span>
              <span>-{formatIDR(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400">
            <span>PPN (10%)</span>
            <span className="font-medium text-slate-200">
              {formatIDR(taxAmount)}
            </span>
          </div>

          <div className="flex justify-between items-center text-base font-extrabold text-white pt-2 border-t border-slate-800">
            <span>Grand Total</span>
            <span className="text-emerald-400 text-lg">
              {formatIDR(grandTotal)}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={handleOpenPayment}
            className={`w-full py-3 mt-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg ${
              cart.length === 0
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Bayar Transaksi ({formatIDR(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 relative border border-slate-700 shadow-2xl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">
              Pembayaran Kasir POS
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Pilih metode pembayaran dan masukkan nominal.
            </p>

            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Tagihan:</span>
                  <span className="font-bold text-white text-sm">
                    {formatIDR(grandTotal)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["CASH", "QRIS", "TRANSFER"].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        paymentMethod === method
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === "CASH" && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nominal Diterima:
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="glass-input w-full text-base font-bold text-emerald-400"
                  />

                  {/* Quick Money Denominations */}
                  <div className="flex gap-2 mt-2">
                    {[grandTotal, 50000, 100000].map((amt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPaymentAmount(amt)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg border border-slate-700 cursor-pointer"
                      >
                        {amt === grandTotal ? "Uang Pas" : formatIDR(amt)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">
                      Kembalian:
                    </span>
                    <span
                      className={`text-base font-extrabold ${changeAmount < 0 ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {formatIDR(changeAmount)}
                    </span>
                  </div>
                </div>
              )}

              <button
                disabled={isSubmitting}
                onClick={handleProcessCheckout}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white font-bold rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Memproses...</span>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Proses Transaksi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Struk Receipt Popup Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 max-w-sm w-full p-6 rounded-2xl shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setReceiptData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-dashed border-slate-300">
              <Sparkles className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <h3 className="text-base font-extrabold tracking-wider uppercase text-slate-900">
                CAFE PANDAWA
              </h3>
              <p className="text-[10px] text-slate-500">Struk Pembayaran</p>
              <p className="text-[10px] text-slate-700 font-bold mt-2">
                {receiptData.invoiceNo}
              </p>
              <p className="text-[10px] text-slate-500">
                {new Date(receiptData.createdAt).toLocaleString("id-ID")}
              </p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
              {receiptData.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span>
                    {item.product?.name || item.productName} (x{item.quantity})
                  </span>
                  <span className="font-bold">{formatIDR(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="py-3 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Pajak (10%)</span>
                <span>{formatIDR(receiptData.taxAmount)}</span>
              </div>
              {receiptData.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon</span>
                  <span>-{formatIDR(receiptData.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-slate-200 text-slate-900">
                <span>TOTAL</span>
                <span>{formatIDR(receiptData.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>BAYAR ({receiptData.paymentMethod})</span>
                <span>{formatIDR(receiptData.paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>KEMBALI</span>
                <span>{formatIDR(receiptData.changeAmount)}</span>
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
