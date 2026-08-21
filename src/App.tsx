import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderPlus,
  Users,
  Store,
  Menu,
  X,
  LogOut,
  UserCheck,
  UserCog,
  ShieldAlert,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";
import { Login } from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { POSCashier } from "./components/POSCashier";
import { ProductsManager } from "./components/ProductsManager";
import { CategoriesManager } from "./components/CategoriesManager";
import { CustomersManager } from "./components/CustomersManager";
import { UsersManager } from "./components/UsersManager";
// import { TransactionsHistory } from "./components/TransactionsHistory";
import { SalesReport } from "./components/SalesReport";
import { ProfileModal } from "./components/ProfileModal";

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [accessDeniedAlert, setAccessDeniedAlert] = useState<string | null>(
    null,
  );
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("pos_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem("pos_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // HTML5 History API Routing (e.g. /admin/dashboard vs /cashier/pos)
  const parseRouteFromPath = (user: any) => {
    const pathname = window.location.pathname.toLowerCase();
    const parts = pathname.split("/").filter(Boolean);
    const rolePrefix = parts[0];
    const tabName = parts[1] || parts[0];

    const isAdmin = user?.role === "ADMIN";
    const validAdminTabs = [
      "dashboard",
      "pos",
      "products",
      "categories",
      "customers",
      "users",
      "reports",
      "transactions",
    ];
    const validCashierTabs = ["pos", "transactions"];

    if (isAdmin) {
      if (rolePrefix === "cashier") {
        const targetTab =
          tabName && validAdminTabs.includes(tabName) ? tabName : "dashboard";
        window.history.replaceState({}, "", `/admin/${targetTab}`);
        return targetTab;
      }
      if (tabName && validAdminTabs.includes(tabName)) {
        return tabName;
      }
      window.history.replaceState({}, "", "/admin/dashboard");
      return "dashboard";
    } else {
      // CASHIER
      if (
        rolePrefix === "admin" ||
        (tabName && !validCashierTabs.includes(tabName))
      ) {
        setAccessDeniedAlert(
          "Akses Ditolak: Halaman Master Data & Dashboard khusus untuk Administrator!",
        );
        setTimeout(() => setAccessDeniedAlert(null), 4000);
        window.history.replaceState({}, "", "/cashier/pos");
        return "pos";
      }
      if (tabName && validCashierTabs.includes(tabName)) {
        return tabName;
      }
      window.history.replaceState({}, "", "/cashier/pos");
      return "pos";
    }
  };

  const changeTab = (tabId: string) => {
    if (
      currentUser?.role === "CASHIER" &&
      !["pos", "transactions"].includes(tabId)
    ) {
      setAccessDeniedAlert("Menu ini hanya dapat diakses oleh Admin.");
      setTimeout(() => setAccessDeniedAlert(null), 4000);
      return;
    }
    setActiveTab(tabId);
    const prefix = currentUser?.role === "ADMIN" ? "admin" : "cashier";
    const newPath = `/${prefix}/${tabId}`;
    window.history.pushState({}, "", newPath);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (currentUser) {
        const resolvedTab = parseRouteFromPath(currentUser);
        setActiveTab(resolvedTab);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentUser]);

  useEffect(() => {
    // Validate JWT session token on app mount
    const savedToken = localStorage.getItem("pos_jwt_token");
    if (savedToken) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setCurrentUser(json.data);
            setJwtToken(savedToken);
            const initialTab = parseRouteFromPath(json.data);
            setActiveTab(initialTab);
          } else {
            localStorage.removeItem("pos_jwt_token");
            localStorage.removeItem("pos_user");
          }
        })
        .catch(() => {
          const savedUser = localStorage.getItem("pos_user");
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              setCurrentUser(parsed);
              setJwtToken(savedToken);
              const initialTab = parseRouteFromPath(parsed);
              setActiveTab(initialTab);
            } catch {
              localStorage.removeItem("pos_user");
            }
          }
        })
        .finally(() => setLoadingSession(false));
    } else {
      setLoadingSession(false);
    }
  }, []);

  const handleLoginSuccess = (user: any, token: string) => {
    setCurrentUser(user);
    setJwtToken(token);
    localStorage.setItem("pos_user", JSON.stringify(user));
    localStorage.setItem("pos_jwt_token", token);

    const prefix = user.role === "ADMIN" ? "admin" : "cashier";
    const defaultTab = user.role === "ADMIN" ? "dashboard" : "pos";
    setActiveTab(defaultTab);
    window.history.pushState({}, "", `/${prefix}/${defaultTab}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setJwtToken("");
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_jwt_token");
    window.history.pushState({}, "", "/login");
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#0b1329] flex flex-col items-center justify-center text-slate-300 font-sans space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide text-slate-400">
          Memuat data aplikasi...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Filter Sidebar Menus by Role (Kasir does NOT see Master Data or Dashboard)
  const isAdmin = currentUser.role === "ADMIN";
  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      role: "ADMIN",
    },
    {
      id: "pos",
      label: "Kasir POS (Checkout)",
      icon: ShoppingBag,
      role: "ALL",
    },
    { id: "products", label: "Master Produk", icon: Package, role: "ADMIN" },
    {
      id: "categories",
      label: "Master Kategori",
      icon: FolderPlus,
      role: "ADMIN",
    },
    { id: "customers", label: "Master Pelanggan", icon: Users, role: "ADMIN" },
    { id: "users", label: "Master Kasir", icon: UserCog, role: "ADMIN" },
    {
      id: "reports",
      label: "Laporan Penjualan",
      icon: TrendingUp,
      role: "ADMIN",
    },
  ].filter((item) => item.role === "ALL" || (isAdmin && item.role === "ADMIN"));

  const currentPrefix = isAdmin ? "admin" : "cashier";

  return (
    <div className="min-h-screen flex bg-[#0b1329] text-slate-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo & Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/30 text-white">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-lg tracking-tight text-white">
                  CAFE
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">
                  PANDAWA
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Tutup menu navigasi"
              className="p-1 text-slate-400 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card in Sidebar */}
          <div className="mx-3 mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : "U"}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-xs text-white line-clamp-1">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      isAdmin
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {currentUser.role || "CASHIER"}
                  </span>
                  <span className="text-[9px] font-mono text-indigo-400"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 mt-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    changeTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`}
                    />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-3 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar Header */}
        <header className="bg-slate-900/40 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="p-2 bg-slate-800 text-slate-300 rounded-xl lg:hidden hover:bg-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition cursor-pointer"
              title={
                theme === "dark"
                  ? "Ganti ke Mode Terang (Light Mode)"
                  : "Ganti ke Mode Gelap (Dark Mode)"
              }
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">
                    Mode Terang
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800">
                    Mode Gelap
                  </span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              aria-label="Pengaturan akun"
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
              title="Pengaturan Akun"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={handleLogout}
              aria-label="Keluar dari akun"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Access Denied Warning Toast Alert */}
        {accessDeniedAlert && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-6 py-2.5 text-xs font-semibold flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{accessDeniedAlert}</span>
          </div>
        )}

        {/* Dynamic Tab Body Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === "dashboard" &&
            (isAdmin ? (
              <Dashboard onNavigateTab={changeTab} token={jwtToken} />
            ) : (
              <POSCashier token={jwtToken} currentUser={currentUser} />
            ))}
          {activeTab === "pos" && (
            <POSCashier token={jwtToken} currentUser={currentUser} />
          )}
          {activeTab === "products" &&
            (isAdmin ? (
              <ProductsManager token={jwtToken} />
            ) : (
              <POSCashier token={jwtToken} currentUser={currentUser} />
            ))}
          {activeTab === "categories" &&
            (isAdmin ? (
              <CategoriesManager token={jwtToken} />
            ) : (
              <POSCashier token={jwtToken} currentUser={currentUser} />
            ))}
          {activeTab === "customers" &&
            (isAdmin ? (
              <CustomersManager token={jwtToken} />
            ) : (
              <POSCashier token={jwtToken} currentUser={currentUser} />
            ))}
          {activeTab === "users" &&
            (isAdmin ? (
              <UsersManager token={jwtToken} />
            ) : (
              <POSCashier token={jwtToken} currentUser={currentUser} />
            ))}
          {activeTab === "reports" &&
            (isAdmin ? (
              <SalesReport token={jwtToken} />
            ) : (
              <POSCashier token={jwtToken} currentUser={currentUser} />
            ))}
        </main>
      </div>

      {/* Update Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          currentUser={currentUser}
          token={jwtToken}
          onClose={() => setShowProfileModal(false)}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem("pos_user", JSON.stringify(updated));
          }}
        />
      )}
    </div>
  );
}

export default App;
