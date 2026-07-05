import { useState, useEffect } from 'react';
import { 
  Wallet, Info, CheckCircle2, AlertCircle, LogOut, Store, Truck, Landmark, LayoutDashboard
} from 'lucide-react';
import { connectFreighter } from './lib/freighter';
import { WarungPages } from './pages/WarungPages';
import { SupplierPages } from './pages/SupplierPages';
import { AdminPages } from './pages/AdminPages';
import { useAuth } from './context/AuthContext';

export const formatRupiah = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
};

export const shortAddress = (addr: string) => {
  if (!addr) return '';
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

const API_URL = 'http://localhost:8080/api';
type Workspace = 'overview' | 'warung' | 'supplier' | 'funder';

export default function App() {
  const { user, wallet, login, logout, isLoading: isAuthLoading } = useAuth();
  const [network, setNetwork] = useState<string>('Testnet');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>('overview');
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Connect Freighter wallet
  const handleConnectWallet = async () => {
    setIsLoading(true);
    try {
      const res = await connectFreighter();
      setNetwork(res.network);
      
      // Register with Go API
      const authRes = await fetch(`${API_URL}/auth/connect-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: res.publicKey })
      });
      const data = await authRes.json();
      if (authRes.ok) {
        login(res.publicKey, data.user);
        triggerToast("Dompet Freighter Terhubung!", "success");
      } else {
        triggerToast(data.error || "Gagal sinkronisasi data user", "error");
      }
    } catch (err: any) {
      triggerToast(err.message || "Gagal menghubungkan Freighter", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    triggerToast("Berhasil keluar.", "info");
  };

  const handleDemoAccess = () => {
    const demoWallet = 'GDEMOALLACCESS0000000000000000000000000000000000001';
    login(demoWallet, {
      id: 999,
      wallet_address: demoWallet,
      role: 'admin',
      name: 'Demo All Access'
    });
    setNetwork('Demo');
    triggerToast("Mode demo aktif. Semua fitur dapat diakses.", "success");
  };

  const workspaceItems = [
    { id: 'overview' as Workspace, label: 'Ringkasan Flow', icon: LayoutDashboard },
    { id: 'warung' as Workspace, label: 'Warung', icon: Store },
    { id: 'supplier' as Workspace, label: 'Supplier', icon: Truck },
    { id: 'funder' as Workspace, label: 'Funder/Admin', icon: Landmark }
  ];

  if (isAuthLoading) {
    return (
      <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ border: '4px solid var(--surface-border)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  // Render Login Screen if no user
  if (!user) {
    return (
      <div className="login-screen">
        <div className="login-card glass-panel">
          <div className="sidebar-logo" style={{ marginBottom: '2rem', textAlign: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '1.8rem' }}>Lumbung Desa <span>Digital</span></h2>
          </div>
          <p className="login-subtitle">Solusi Rantai Pasok & Kredit Usaha Mikro</p>
          
          <button className="btn btn-primary login-btn" onClick={handleConnectWallet} disabled={isLoading}>
            {isLoading ? (
               <div style={{ border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}></div>
            ) : (
              <>
                <Wallet size={20} /> Hubungkan dengan Freighter
              </>
            )}
          </button>
          <button className="btn btn-secondary login-btn demo-login-btn" onClick={handleDemoAccess} disabled={isLoading}>
            <LayoutDashboard size={20} /> Masuk Mode Demo
          </button>
          <p className="login-note">Mode demo membuka semua role untuk pilot dan pengujian wallet terbatas.</p>
        </div>
        {/* Floating Toast Alerts */}
        {toast && (
          <div className="toast-container">
            <div className={`toast ${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}`}>
              {toast.type === 'success' && <CheckCircle2 size={16} />}
              {toast.type === 'error' && <AlertCircle size={16} />}
              {toast.type === 'info' && <Info size={16} />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-layout" style={{ flexDirection: 'column' }}>
      
      {/* 1. Header Topbar */}
      <div className="app-topbar glass-header" style={{ position: 'sticky', top: 0, width: '100%', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <div className="sidebar-logo" style={{ marginBottom: 0 }}>
            <h2>Lumbung Desa <span>Digital</span></h2>
          </div>
          <div className="role-badge">
            Akses: <strong>Semua Role</strong>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="user-profile-badge">
            <div className="status-dot"></div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="wallet-addr">{shortAddress(wallet)} ({network})</span>
            </div>
          </div>
          <button className="btn btn-secondary logout-btn" onClick={handleLogout} title="Keluar">
            <LogOut size={16} /> 
          </button>
        </div>
      </div>

      {/* 2. Main Pages Container */}
      <div className="app-content" style={{ padding: '2rem' }}>
        {isLoading && (
          <div className="modal-overlay glass-overlay">
            <div className="loading-container">
              <div className="spinner"></div>
              <strong>Memproses Transaksi...</strong>
            </div>
          </div>
        )}

        <div className="workspace-tabs" role="tablist" aria-label="Navigasi role aplikasi">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`workspace-tab ${activeWorkspace === item.id ? 'active' : ''}`}
                onClick={() => setActiveWorkspace(item.id)}
                type="button"
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {activeWorkspace === 'overview' && (
          <section className="overview-shell">
            <div className="overview-hero">
              <div>
                <span className="eyebrow">Invoice-based supplier financing</span>
                <h1>Warung dapat stok, supplier lebih pasti dibayar, funder melihat dana mengalir ke barang produktif.</h1>
                <p>
                  Alur MVP mengikuti PRD: request barang dari katalog, review supplier, invoice dan escrow,
                  pengiriman, konfirmasi penerimaan, payout, cicilan, lalu reputasi dan limit diperbarui.
                </p>
              </div>
              <div className="flow-stack" aria-label="Tahapan flow bisnis">
                {['Request stok', 'Review supplier', 'Escrow funded', 'Barang diterima', 'Repayment', 'Limit update'].map((step, index) => (
                  <div className="flow-step" key={step}>
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Scope MVP</span>
                  <span className="stat-value">End-to-end</span>
                  <span className="stat-sub">Katalog, request, invoice, escrow, repayment, reputasi</span>
                </div>
                <div className="stat-icon-wrapper primary"><CheckCircle2 size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Prinsip Produk</span>
                  <span className="stat-value">Productive-first</span>
                  <span className="stat-sub">Tidak ada pencairan dana tunai bebas pakai</span>
                </div>
                <div className="stat-icon-wrapper secondary"><Store size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Kontrol Risiko</span>
                  <span className="stat-value">Limit kecil</span>
                  <span className="stat-sub">Naik bertahap dari riwayat pembayaran</span>
                </div>
                <div className="stat-icon-wrapper warning"><AlertCircle size={20} /></div>
              </div>
            </div>

            <div className="role-lanes">
              <button className="role-lane" onClick={() => setActiveWorkspace('warung')} type="button">
                <Store size={22} />
                <strong>Warung</strong>
                <span>Pilih SKU, lihat invoice, konfirmasi barang, bayar cicilan, pantau reputasi.</span>
              </button>
              <button className="role-lane" onClick={() => setActiveWorkspace('supplier')} type="button">
                <Truck size={22} />
                <strong>Supplier</strong>
                <span>Review permintaan, kelola katalog, kirim barang, pantau payout escrow.</span>
              </button>
              <button className="role-lane" onClick={() => setActiveWorkspace('funder')} type="button">
                <Landmark size={22} />
                <strong>Funder/Admin</strong>
                <span>Alokasi funding, portfolio aktif, risiko komunitas, audit event, dan pengguna.</span>
              </button>
            </div>
          </section>
        )}

        {activeWorkspace === 'warung' && (
          <WarungPages wallet={wallet} triggerToast={triggerToast} isLoading={isLoading} setIsLoading={setIsLoading} />
        )}
        {activeWorkspace === 'supplier' && (
          <SupplierPages wallet={wallet} triggerToast={triggerToast} setIsLoading={setIsLoading} />
        )}
        {activeWorkspace === 'funder' && (
          <AdminPages wallet={wallet} triggerToast={triggerToast} setIsLoading={setIsLoading} />
        )}
      </div>

      {/* 3. Footer */}
      <footer style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', borderTop: '1px solid var(--surface-border)', marginTop: 'auto' }}>
        © 2026 Lumbung Desa Digital - Hak Cipta Dilindungi.
      </footer>

      {/* 4. Floating Toast Alerts */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}`}>
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}
