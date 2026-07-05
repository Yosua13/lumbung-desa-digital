import React, { useState, useEffect } from 'react';
import { 
  FileText, ClipboardList, Users, Package, 
  TrendingUp, DollarSign, Plus, Check, X, Eye
} from 'lucide-react';
import { supplierService } from '../services/supplierService';
import { formatRupiah } from '../App';

const formatRp = (v: number) => formatRupiah ? formatRupiah(v) : `Rp ${v.toLocaleString('id-ID')}`;

interface SupplierProps {
  wallet: string;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setIsLoading: (v: boolean) => void;
}

export function SupplierPages({ wallet, triggerToast, setIsLoading }: SupplierProps) {
  const [subPage, setSubPage] = useState<'dashboard' | 'requests' | 'warungs' | 'products' | 'payouts'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [warungs, setWarungs] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedWarung, setSelectedWarung] = useState<any>(null);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  
  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '', category: 'Sembako', price: '', stock: '', min_order: '', unit: 'pcs'
  });

  const loadData = async () => {
    if (!wallet) return;
    const dash = await supplierService.getDashboard(wallet);
    setDashboardData(dash);
    
    const reqs = await supplierService.getRequests(wallet);
    setRequests(reqs);
    
    const wrgs = await supplierService.getWarungs();
    setWarungs(wrgs);
    
    const prods = await supplierService.getProducts();
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, [wallet]);

  // Approve Credit Request (generates on-chain invoice)
  const handleApprove = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await supplierService.approveRequest(wallet, id);
      triggerToast(`Permintaan disetujui! Invoice on-chain dibuat. Hash: ${res.tx_hash.substring(0, 10)}...`, "success");
      loadData();
      setSelectedRequest(null);
    } catch (e: any) {
      triggerToast(e.message || "Persetujuan gagal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Reject Request
  const handleReject = async (id: number) => {
    setIsLoading(true);
    try {
      await supplierService.rejectRequest(wallet, id);
      triggerToast("Permintaan ditolak. Batas plafon kredit dikembalikan ke warung.", "info");
      loadData();
      setSelectedRequest(null);
    } catch (e: any) {
      triggerToast(e.message || "Gagal menolak", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Mark Shipped (Signs on-chain shipped status)
  const handleMarkShipped = async (invoiceId: number) => {
    setIsLoading(true);
    try {
      const prep = await supplierService.prepareMarkShipped(wallet, invoiceId);
      let signedXdr = "MOCK_SIGNED_SHIP_XDR";
      try {
        const { signTx } = await import('../lib/freighter');
        signedXdr = await signTx(prep.unsigned_xdr);
      } catch (e) {
        console.warn("Freighter offline, using mock signature");
      }
      await supplierService.submitMarkShipped(wallet, invoiceId, signedXdr);
      triggerToast("Konfirmasi Pengiriman Berhasil! Menunggu warung menerima barang.", "success");
      loadData();
    } catch (e: any) {
      triggerToast(e.message || "Gagal menandai barang dikirim", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Add Product Form Submit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      triggerToast("Harap isi semua kolom wajib!", "error");
      return;
    }
    setIsLoading(true);
    try {
      await supplierService.addProduct(wallet, {
        ...newProduct,
        price: parseInt(newProduct.price),
        stock: parseInt(newProduct.stock),
        min_order: parseInt(newProduct.min_order || '1')
      });
      triggerToast("Produk baru berhasil ditambahkan ke katalog!", "success");
      setShowAddProductModal(false);
      setNewProduct({ name: '', category: 'Sembako', price: '', stock: '', min_order: '', unit: 'pcs' });
      loadData();
    } catch (e) {
      triggerToast("Gagal menambahkan produk", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      
      {/* Sidebar Local Section */}
      <div className="card" style={{ width: '220px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start' }}>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Menu Supplier</h4>
        <button className={`sidebar-item ${subPage === 'dashboard' ? 'active' : ''}`} onClick={() => { setSubPage('dashboard'); setSelectedRequest(null); }} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <FileText size={16} /> Dashboard
        </button>
        <button className={`sidebar-item ${subPage === 'requests' ? 'active' : ''}`} onClick={() => setSubPage('requests')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <ClipboardList size={16} /> Permintaan Stok
        </button>
        <button className={`sidebar-item ${subPage === 'warungs' ? 'active' : ''}`} onClick={() => setSubPage('warungs')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <Users size={16} /> Data Warung
        </button>
        <button className={`sidebar-item ${subPage === 'products' ? 'active' : ''}`} onClick={() => setSubPage('products')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <Package size={16} /> Produk SKU
        </button>
        <button className={`sidebar-item ${subPage === 'payouts' ? 'active' : ''}`} onClick={() => setSubPage('payouts')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <DollarSign size={16} /> Payouts Escrow
        </button>
      </div>

      {/* Main SubPage Switcher */}
      <div style={{ flex: 1 }}>
        
        {/* SUBPAGE 1: DASHBOARD */}
        {subPage === 'dashboard' && (
          <div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Permintaan Baru</span>
                  <span className="stat-value">{dashboardData ? dashboardData.pending_requests : '0'}</span>
                  <span className="stat-sub">Butuh review persetujuan</span>
                </div>
                <div className="stat-icon-wrapper primary"><ClipboardList size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Escrow Payouts Tertunda</span>
                  <span className="stat-value">{dashboardData ? formatRp(dashboardData.payouts_pending) : 'Rp0'}</span>
                  <span className="stat-sub">Barang dalam proses pengiriman</span>
                </div>
                <div className="stat-icon-wrapper secondary"><DollarSign size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Total Nilai Penjualan</span>
                  <span className="stat-value" style={{ color: 'var(--primary)' }}>{dashboardData ? formatRp(dashboardData.total_sales) : 'Rp0'}</span>
                  <span className="stat-sub">Lunas / Sedang Cicil</span>
                </div>
                <div className="stat-icon-wrapper primary"><TrendingUp size={20} /></div>
              </div>
            </div>

            {/* Quick overview of requests */}
            <div className="data-card">
              <div className="card-header">
                <h3 className="card-title">Permintaan Masuk Terbaru</h3>
                <button className="btn btn-secondary" onClick={() => setSubPage('requests')}>Lihat Semua</button>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Warung</th>
                      <th>Nilai Pengajuan</th>
                      <th>Skor Kredit</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.slice(0, 3).map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.warung_name}</strong></td>
                        <td>{formatRp(r.total_amount)}</td>
                        <td><span className="badge badge-purple">{r.reputation_score} / 1000</span></td>
                        <td>{new Date(r.requested_at).toLocaleDateString('id-ID')}</td>
                        <td><span className="badge badge-warning">{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 2: Permintaan Stok (Review requests) */}
        {subPage === 'requests' && (
          <div className="grid-aside">
            {/* List column */}
            <div>
              <div className="data-card">
                <div className="card-header">
                  <h3 className="card-title">Daftar Pengajuan Stok Kredit Warung</h3>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Warung</th>
                        <th>Jumlah Pengajuan</th>
                        <th>Skor Kredit</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r) => (
                        <tr key={r.id} className={`clickable ${selectedRequest?.id === r.id ? 'active' : ''}`} onClick={() => setSelectedRequest(r)}>
                          <td><strong>{r.warung_name}</strong></td>
                          <td>{formatRp(r.total_amount)}</td>
                          <td><span className="badge badge-purple">{r.reputation_score}</span></td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}><Eye size={12} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar detail review panel */}
            <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Review Otorisasi
              </h3>

              {!selectedRequest ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <ClipboardList size={32} />
                  <p style={{ fontSize: '0.8rem' }}>Pilih pengajuan dari tabel untuk menampilkan rincian data risiko.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{selectedRequest.warung_name}</h4>
                    <span className="badge badge-purple" style={{ marginTop: '0.25rem' }}>Skor Reputasi: {selectedRequest.reputation_score}/1000</span>
                  </div>

                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', background: 'var(--background)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div><strong>Total Order:</strong> {formatRp(selectedRequest.total_amount)}</div>
                    <div><strong>Tanggal Pengajuan:</strong> {new Date(selectedRequest.requested_at).toLocaleDateString('id-ID')}</div>
                    <div><strong>Rekomendasi Tenor:</strong> 30 Hari (Lancar)</div>
                  </div>

                  {/* Risk analysis mock */}
                  <div className="card" style={{ padding: '0.75rem', borderLeft: '3px solid var(--primary)', background: '#fff', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--primary-hover)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={14} /> Risiko Rendah</div>
                    <p style={{ marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Warung ini memiliki histori pembayaran 100% tepat waktu pada invoice sebelumnya.</p>
                  </div>

                  {selectedRequest.status === 'REQUESTED' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ flex: 1, display: 'flex', gap: '0.25rem' }} onClick={() => handleApprove(selectedRequest.id)}>
                        <Check size={14} /> Setujui
                      </button>
                      <button className="btn btn-danger" style={{ display: 'flex', gap: '0.25rem' }} onClick={() => handleReject(selectedRequest.id)}>
                        <X size={14} /> Tolak
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBPAGE 3: Data Warung */}
        {subPage === 'warungs' && (
          <div className="grid-aside">
            <div>
              <div className="data-card">
                <div className="card-header">
                  <h3 className="card-title">Portofolio Warung Rekanan</h3>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Warung</th>
                        <th>Pemilik</th>
                        <th>Kota</th>
                        <th>Skor Reputasi</th>
                        <th>Limit Kredit</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {warungs.map((w) => (
                        <tr key={w.id} className="clickable" onClick={() => setSelectedWarung(w)}>
                          <td><strong>{w.name}</strong></td>
                          <td>{w.owner}</td>
                          <td>{w.city}</td>
                          <td><span className="badge badge-purple">{w.reputation_score}</span></td>
                          <td>{formatRp(w.credit_limit)}</td>
                          <td>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Detail</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar warung detail details */}
            <div className="card" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                Profil Warung
              </h3>
              {!selectedWarung ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <Users size={32} />
                  <p style={{ fontSize: '0.8rem' }}>Pilih warung dari daftar rekanan untuk melihat performa transaksi dan riwayat belanja.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Nama Toko:</strong> {selectedWarung.name}</div>
                  <div><strong>Pemilik:</strong> {selectedWarung.owner}</div>
                  <div><strong>Kota:</strong> {selectedWarung.city}</div>
                  <div><strong>Batas Plafon:</strong> {formatRp(selectedWarung.credit_limit)}</div>
                  <div><strong>Sisa Limit:</strong> {formatRp(selectedWarung.available_limit)}</div>
                  
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '0.5rem' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Faktor Risiko:</div>
                    <span className="badge badge-success">Risiko Rendah</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBPAGE 4: Produk SKU */}
        {subPage === 'products' && (
          <div>
            <div className="data-card">
              <div className="card-header">
                <h3 className="card-title">Katalog & Manajemen Stok Barang</h3>
                <button className="btn btn-primary" onClick={() => setShowAddProductModal(true)}>
                  <Plus size={16} /> Tambah Produk
                </button>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Harga/Unit</th>
                      <th>MOQ</th>
                      <th>Stok</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td>{formatRp(p.price)}</td>
                        <td>{p.min_order} {p.unit}</td>
                        <td>
                          <span style={{ fontWeight: 'bold', color: p.stock < 10 ? 'var(--danger)' : 'var(--text-primary)' }}>
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${p.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {p.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 5: Payouts Escrow */}
        {subPage === 'payouts' && (
          <div className="data-card">
            <div className="card-header">
              <h3 className="card-title">Pencairan Dana Escrow</h3>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Warung</th>
                    <th>Jumlah Pendanaan</th>
                    <th>Status Escrow</th>
                    <th>Aksi Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Active funded or shipped invoices */}
                  <tr>
                    <td><strong>INV-#1</strong></td>
                    <td>Warung Grosir Nusantara</td>
                    <td>{formatRp(3000000)}</td>
                    <td><span className="badge badge-warning">Repaying</span></td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-hover)' }}>Lunas Terbayar</span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>INV-#2</strong></td>
                    <td>Toko Sejahtera</td>
                    <td>{formatRp(4000000)}</td>
                    <td><span className="badge badge-info">Funded</span></td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleMarkShipped(2)}>
                        Tandai Barang Dikirim
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Tambah SKU Produk Baru</h3>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowAddProductModal(false)}>X</button>
            </div>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Nama Produk *</label>
                <input className="topbar-search input" style={{ width: '100%', padding: '0.5rem', background: '#fff' }} type="text" placeholder="Contoh: Beras Premium Rojo Lele" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
              </div>
              <div className="grid-2">
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Kategori *</label>
                  <select style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }} value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                    <option>Sembako</option>
                    <option>Minyak</option>
                    <option>Mie Instan</option>
                    <option>Telur</option>
                    <option>Minuman</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Unit Kemasan</label>
                  <input className="topbar-search input" style={{ width: '100%', padding: '0.5rem', background: '#fff' }} type="text" placeholder="Contoh: karung/dus/pcs" value={newProduct.unit} onChange={e => setNewProduct({...newProduct, unit: e.target.value})} />
                </div>
              </div>
              <div className="grid-3">
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Harga *</label>
                  <input className="topbar-search input" style={{ width: '100%', padding: '0.5rem', background: '#fff' }} type="number" placeholder="Harga Rp" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Stok *</label>
                  <input className="topbar-search input" style={{ width: '100%', padding: '0.5rem', background: '#fff' }} type="number" placeholder="Stok Qty" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Min Order</label>
                  <input className="topbar-search input" style={{ width: '100%', padding: '0.5rem', background: '#fff' }} type="number" placeholder="MOQ" value={newProduct.min_order} onChange={e => setNewProduct({...newProduct, min_order: e.target.value})} />
                </div>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem' }} type="submit">
                Simpan SKU Baru
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
