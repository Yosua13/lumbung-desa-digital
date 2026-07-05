import { useState, useEffect } from 'react';
import { 
  FileText, ShoppingBag, ArrowRightLeft, Award, 
  DollarSign, Info, Plus, Minus,
  ShoppingCart, Calendar, ShieldCheck, TrendingUp
} from 'lucide-react';
import { warungService } from '../services/warungService';
import { formatRupiah, shortAddress } from '../App';

// Format Rupiah inside this file as well for utility safety
const formatRp = (v: number) => formatRupiah ? formatRupiah(v) : `Rp ${v.toLocaleString('id-ID')}`;

interface WarungProps {
  wallet: string;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

export function WarungPages({ wallet, triggerToast, isLoading, setIsLoading }: WarungProps) {
  const [subPage, setSubPage] = useState<'dashboard' | 'shop' | 'installments' | 'reputation'>('dashboard');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  
  // Fetch data on load
  const loadData = async () => {
    if (!wallet) return;
    const dash = await warungService.getDashboard(wallet);
    setDashboardData(dash);
    
    const prods = await warungService.getProducts();
    setProducts(prods);
    
    const invs = await warungService.getInvoices(wallet);
    setInvoices(invs);
  };

  useEffect(() => {
    loadData();
  }, [wallet]);

  // Handle Cart Increments
  const handleQtyChange = (productId: number, delta: number, minOrder: number) => {
    const curr = cart[productId] || 0;
    let next = curr + delta;
    if (next < 0) next = 0;
    if (next > 0 && next < minOrder && delta > 0) next = minOrder; // enforce MOQ on add
    setCart({ ...cart, [productId]: next });
  };

  // Submit Credit Request
  const handleCheckout = async () => {
    const items = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ product_id: parseInt(id), quantity: qty }));

    if (items.length === 0) return;
    setIsLoading(true);
    try {
      await warungService.createCreditRequest(wallet, 1, items);
      triggerToast("Pengajuan Kredit Berhasil Diajukan!", "success");
      setCart({});
      loadData();
      setSubPage('dashboard');
    } catch (e: any) {
      triggerToast(e.message || "Pengajuan gagal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Goods Receipt
  const handleConfirmDelivery = async (id: number) => {
    setIsLoading(true);
    try {
      const prep = await warungService.prepareConfirmDelivery(wallet, id);
      // Fallback if not using a real freighter signer (simulated payload)
      let signedXdr = "MOCK_SIGNED_DELIVERY_XDR";
      try {
        const { signTx } = await import('../lib/freighter');
        signedXdr = await signTx(prep.unsigned_xdr);
      } catch (e) {
        console.warn("Wallet signer offline, using simulation fallback");
      }
      
      await warungService.submitConfirmDelivery(wallet, id, signedXdr);
      triggerToast("Konfirmasi Penerimaan Sukses! Dana escrow dilepas.", "success");
      loadData();
      setSelectedInvoice(null);
    } catch (e: any) {
      triggerToast(e.message || "Konfirmasi gagal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Pay Installment
  const handlePayInstallment = async (invoiceId: number, amount: number) => {
    setIsLoading(true);
    try {
      const prep = await warungService.preparePayInstallment(wallet, invoiceId, amount);
      let signedXdr = "MOCK_SIGNED_PAYMENT_XDR";
      try {
        const { signTx } = await import('../lib/freighter');
        signedXdr = await signTx(prep.unsigned_xdr);
      } catch (e) {
        console.warn("Wallet signer offline, using simulation fallback");
      }
      
      await warungService.submitPayInstallment(wallet, invoiceId, amount, signedXdr);
      triggerToast("Pembayaran Cicilan Berhasil! Reputasi Anda meningkat.", "success");
      loadData();
      setSelectedInvoice(null);
    } catch (e: any) {
      triggerToast(e.message || "Pembayaran gagal", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch detailed view for single invoice
  const openInvoiceDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const detail = await warungService.getInvoiceDetail(id);
      setSelectedInvoice(detail);
    } catch (e) {
      triggerToast("Gagal mengambil detail invoice", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      
      {/* Sidebar Local Section */}
      <div className="card" style={{ width: '220px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start' }}>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Menu Warung</h4>
        <button className={`sidebar-item ${subPage === 'dashboard' ? 'active' : ''}`} onClick={() => { setSubPage('dashboard'); setSelectedInvoice(null); }} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <FileText size={16} /> Dashboard
        </button>
        <button className={`sidebar-item ${subPage === 'shop' ? 'active' : ''}`} onClick={() => setSubPage('shop')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <ShoppingBag size={16} /> Ajukan Stok
        </button>
        <button className={`sidebar-item ${subPage === 'installments' ? 'active' : ''}`} onClick={() => setSubPage('installments')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <ArrowRightLeft size={16} /> Cicilan Saya
        </button>
        <button className={`sidebar-item ${subPage === 'reputation' ? 'active' : ''}`} onClick={() => setSubPage('reputation')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <Award size={16} /> Reputasi
        </button>
      </div>

      {/* Main SubPage Switcher */}
      <div style={{ flex: 1 }}>
        
        {/* SUBPAGE 1: DASHBOARD */}
        {subPage === 'dashboard' && !selectedInvoice && (
          <div>
            {/* Stats Header */}
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Limit Kredit Tersedia</span>
                  <span className="stat-value">{dashboardData ? formatRp(dashboardData.available_limit) : 'Rp0'}</span>
                  <span className="stat-sub">Dari total plafon: {dashboardData ? formatRp(dashboardData.credit_limit) : 'Rp0'}</span>
                </div>
                <div className="stat-icon-wrapper primary"><DollarSign size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Tagihan Aktif</span>
                  <span className="stat-value">{dashboardData ? formatRp(dashboardData.active_invoice_sum) : 'Rp0'}</span>
                  <span className="stat-sub">Sisa hutang berjalan</span>
                </div>
                <div className="stat-icon-wrapper secondary"><FileText size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Jatuh Tempo Terdekat</span>
                  <span className="stat-value" style={{ color: 'var(--warning)' }}>5 Hari Lagi</span>
                  <span className="stat-sub">Tanggal: {dashboardData ? dashboardData.next_repayment_due : '-'}</span>
                </div>
                <div className="stat-icon-wrapper warning"><Calendar size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Skor Reputasi</span>
                  <span className="stat-value" style={{ color: 'var(--purple)' }}>{dashboardData ? dashboardData.reputation_score : '720'}</span>
                  <span className="stat-sub">Kategori: Sangat Baik</span>
                </div>
                <div className="stat-icon-wrapper purple"><Award size={20} /></div>
              </div>
            </div>

            {/* Invoices List */}
            <div className="data-card">
              <div className="card-header">
                <h3 className="card-title">Pembiayaan Barang Berjalan</h3>
                <button className="btn btn-secondary" onClick={() => setSubPage('shop')}>Ajukan Baru</button>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID Invoice</th>
                      <th>Supplier</th>
                      <th>Jumlah Pembiayaan</th>
                      <th>Sisa Tagihan</th>
                      <th>Jatuh Tempo</th>
                      <th>Status Escrow</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="clickable" onClick={() => openInvoiceDetail(inv.id)}>
                        <td><strong>INV/2025/05/{inv.contract_invoice_id}</strong></td>
                        <td>{inv.supplier_name || 'SRC Makmur Jaya'}</td>
                        <td>{formatRp(inv.total_amount)}</td>
                        <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatRp(inv.outstanding_amount)}</td>
                        <td>{new Date(inv.due_date).toLocaleDateString('id-ID')}</td>
                        <td>
                          <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                            {inv.status}
                          </span>
                        </td>
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
        )}

        {/* SUBPAGE 2: INVOICE DETAIL VIEW */}
        {selectedInvoice && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Invoice Detail: INV-#{selectedInvoice.invoice.contract_invoice_id}</h3>
                <span className="badge badge-success" style={{ marginTop: '0.25rem' }}>{selectedInvoice.invoice.status}</span>
              </div>
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>Kembali</button>
            </div>

            <div className="grid-aside">
              <div>
                {/* Details list */}
                <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Informasi Transaksi</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                    <div><strong>Supplier:</strong> {selectedInvoice.invoice.supplier_name} ({selectedInvoice.invoice.supplier_wallet ? shortAddress(selectedInvoice.invoice.supplier_wallet) : '-'})</div>
                    <div><strong>Pembeli:</strong> {selectedInvoice.invoice.warung_name}</div>
                    <div><strong>Total Pembiayaan:</strong> {formatRp(selectedInvoice.invoice.total_amount)}</div>
                    <div><strong>Tenor Cicilan:</strong> {selectedInvoice.invoice.installment_count} Kali</div>
                  </div>
                </div>

                {/* Items Bought Table */}
                <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Ringkasan Barang</h4>
                  <table className="data-table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Harga Satuan</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{formatRp(item.price)}</td>
                          <td>{formatRp(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Repayments Schedule inside invoice */}
                {(selectedInvoice.invoice.status === 'Repaying' || selectedInvoice.invoice.status === 'Paid') && (
                  <div className="card" style={{ padding: '1rem' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Jadwal Cicilan Tagihan</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedInvoice.repayments.map((rep: any) => (
                        <div key={rep.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', alignItems: 'center' }}>
                          <div>
                            <div>Cicilan #{rep.installment_no}</div>
                            <div style={{ color: '#64748b' }}>Due: {new Date(rep.due_date).toLocaleDateString('id-ID')}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <strong>{formatRp(rep.amount)}</strong>
                            {rep.status === 'PAID' ? (
                              <span className="badge badge-success">Lunas</span>
                            ) : (
                              <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handlePayInstallment(selectedInvoice.invoice.id, rep.amount)}>
                                Bayar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar tracker inside detail */}
              <div>
                <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Escrow Timeline</h4>
                  <div className="timeline" style={{ paddingLeft: '1rem' }}>
                    <div className={`timeline-item completed`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-title">Pengajuan</div>
                      <div className="timeline-desc">Invoice diajukan oleh supplier</div>
                    </div>
                    <div className={`timeline-item ${selectedInvoice.invoice.status !== 'Approved' && selectedInvoice.invoice.status !== 'Requested' ? 'completed' : 'active'}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-title">Dana Terkunci</div>
                      <div className="timeline-desc">Funder menyetujui dan mengunci saldo</div>
                    </div>
                    <div className={`timeline-item ${selectedInvoice.invoice.status === 'Shipped' || selectedInvoice.invoice.status === 'Delivered' || selectedInvoice.invoice.status === 'Repaying' || selectedInvoice.invoice.status === 'Paid' ? 'completed' : ''}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-title">Barang Dikirim</div>
                      <div className="timeline-desc">Supplier mengirimkan stok barang</div>
                    </div>
                    <div className={`timeline-item ${selectedInvoice.invoice.status === 'Repaying' || selectedInvoice.invoice.status === 'Paid' ? 'completed' : ''}`}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-title">Diterima / Cair</div>
                      <div className="timeline-desc">Warung mengonfirmasi, dana dilepas</div>
                    </div>
                  </div>
                </div>

                {selectedInvoice.invoice.status === 'Shipped' && (
                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }} onClick={() => handleConfirmDelivery(selectedInvoice.invoice.id)}>
                    Konfirmasi Barang Diterima
                  </button>
                )}

                <div className="card" style={{ padding: '1rem', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem' }}><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} /> Blockchain Info</h4>
                  <div><strong>Network:</strong> Stellar Testnet</div>
                  <div><strong>Contract ID:</strong> <code>CCFPN...WNTS47Y</code></div>
                  {selectedInvoice.invoice.tx_hash_create && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <strong>Tx Hash:</strong> <br />
                      <a href={`https://stellar.expert/explorer/testnet/tx/${selectedInvoice.invoice.tx_hash_create}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                        {shortAddress(selectedInvoice.invoice.tx_hash_create)}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 3: Ajukan Stok (Catalog) */}
        {subPage === 'shop' && (
          <div className="grid-aside">
            {/* Catalog Grid */}
            <div>
              <div className="card" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <h4 style={{ fontWeight: 800, alignSelf: 'center' }}>Pilih Kategori:</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="filter-tab active">Semua</button>
                  <button className="filter-tab">Sembako</button>
                  <button className="filter-tab">Minyak</button>
                  <button className="filter-tab">Mie Instan</button>
                  <button className="filter-tab">Telur</button>
                </div>
              </div>

              <div className="product-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {products.map((p) => {
                  const qty = cart[p.id] || 0;
                  return (
                    <div key={p.id} className="product-card" style={{ height: 'auto' }}>
                      <div className="product-img" style={{ backgroundImage: `url(${p.image_url})`, height: '140px' }}>
                        <span className="product-badge">{p.category}</span>
                      </div>
                      <div className="product-info" style={{ padding: '1rem' }}>
                        <div className="product-name" style={{ fontSize: '0.95rem', fontWeight: 800 }}>{p.name}</div>
                        <div className="product-price" style={{ fontSize: '1.1rem', margin: '0.25rem 0' }}>{formatRp(p.price)}</div>
                        <div className="product-action" style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min order: {p.min_order}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {qty > 0 && (
                              <>
                                <button className="qty-btn" onClick={() => handleQtyChange(p.id, -1, p.min_order)}><Minus size={12} /></button>
                                <strong style={{ fontSize: '0.9rem' }}>{qty}</strong>
                              </>
                            )}
                            <button className="qty-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none' }} onClick={() => handleQtyChange(p.id, 1, p.min_order)}><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Cart checkout summary */}
            <div className="card" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} /> Ringkasan Pengajuan
              </h3>

              {Object.entries(cart).filter(([_, q]) => q > 0).length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <ShoppingCart size={32} />
                  <p style={{ fontSize: '0.8rem' }}>Keranjang belanja kosong. Silakan pilih produk.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Object.entries(cart).filter(([_, q]) => q > 0).map(([id, qty]) => {
                      const p = products.find(x => x.id === parseInt(id));
                      return p ? (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{p.name} (x{qty})</span>
                          <strong>{formatRp(p.price * qty)}</strong>
                        </div>
                      ) : null;
                    })}
                  </div>

                  <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Pengajuan:</span>
                    <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>
                      {formatRp(
                        Object.entries(cart).reduce((sum, [id, qty]) => {
                          const p = products.find(x => x.id === parseInt(id));
                          return sum + (p ? p.price * qty : 0);
                        }, 0)
                      )}
                    </strong>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--background)', padding: '0.5rem', borderRadius: '8px', display: 'flex', gap: '0.25rem' }}>
                    <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Pembayaran cicilan akan terbagi menjadi 5 tenor mingguan otomatis setelah barang diterima.</span>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} onClick={handleCheckout} disabled={isLoading}>
                    Lanjutkan Pengajuan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBPAGE 4: Cicilan Saya */}
        {subPage === 'installments' && (
          <div>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Total Tunggakan Kredit</span>
                  <span className="stat-value">{dashboardData ? formatRp(dashboardData.active_invoice_sum) : 'Rp0'}</span>
                  <span className="stat-sub">Sisa plafon: {dashboardData ? formatRp(dashboardData.available_limit) : 'Rp0'}</span>
                </div>
                <div className="stat-icon-wrapper primary"><DollarSign size={20} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <span className="stat-label">Progress Pelunasan</span>
                  <span className="stat-value">33%</span>
                  <span className="stat-sub">2 dari 6 cicilan lunas</span>
                </div>
                <div className="stat-icon-wrapper secondary"><TrendingUp size={20} /></div>
              </div>
            </div>

            <div className="data-card">
              <div className="card-header">
                <h3 className="card-title">Jadwal Pembayaran Cicilan Aktif</h3>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cicilan Ke</th>
                      <th>Jumlah Tagihan</th>
                      <th>Jatuh Tempo</th>
                      <th>Status Pembayaran</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>INV-#{inv.contract_invoice_id}</strong></td>
                        <td>{formatRp(inv.outstanding_amount)}</td>
                        <td>{new Date(inv.due_date).toLocaleDateString('id-ID')}</td>
                        <td>
                          <span className={`badge ${inv.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                            {inv.status === 'Paid' ? 'Lunas' : 'Belum Lunas'}
                          </span>
                        </td>
                        <td>
                          {inv.status !== 'Paid' ? (
                            <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handlePayInstallment(inv.id, inv.outstanding_amount / 2)}>
                              Bayar Cicilan
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Lunas</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 5: Reputasi */}
        {subPage === 'reputation' && (
          <div className="grid-aside" style={{ gridTemplateColumns: '1fr 320px' }}>
            <div>
              <div className="card" style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
                {/* Gauge chart mock */}
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <h4 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '0.95rem' }}>Skor Kredit Sosial</h4>
                  <div className="gauge-wrapper">
                    <div className="gauge-body"></div>
                    <div className="gauge-fill" style={{ transform: 'rotate(110deg)' }}></div> {/* score mock rotation */}
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--purple)', marginTop: '-20px' }}>835</div>
                  <span className="badge badge-purple" style={{ marginTop: '0.5rem' }}>Sangat Baik</span>
                </div>

                {/* Plafon Limits Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifySelf: 'center', justifyContent: 'center' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Limit Kredit Saat Ini</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-hover)' }}>{dashboardData ? formatRp(dashboardData.credit_limit) : 'Rp0'}</h2>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Limit Kredit Potensial (Next Upgrade)</div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--purple)' }}>Rp 32.000.000</h2>
                  </div>
                </div>
              </div>

              {/* Factors list */}
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Faktor Penilaian Reputasi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Ketepatan Pembayaran</span>
                      <strong>92% (Sangat Baik)</strong>
                    </div>
                    <div className="progress-bar-container"><div className="progress-bar-fill primary" style={{ width: '92%' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Penyelesaian Invoice</span>
                      <strong>88% (Baik)</strong>
                    </div>
                    <div className="progress-bar-container"><div className="progress-bar-fill primary" style={{ width: '88%' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Frekuensi Pembelian</span>
                      <strong>76% (Baik)</strong>
                    </div>
                    <div className="progress-bar-container"><div className="progress-bar-fill primary" style={{ width: '76%' }}></div></div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>Verifikasi Berkas Warung</span>
                      <strong>100% (Lengkap)</strong>
                    </div>
                    <div className="progress-bar-container"><div className="progress-bar-fill primary" style={{ width: '100%' }}></div></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Changes history */}
            <div className="card">
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Riwayat Perubahan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.8rem' }}>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-hover)' }}>+25 Poin</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Pembayaran cicilan tepat waktu INV-#1</div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>24 Mei 2025</span>
                </div>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary-hover)' }}>+15 Poin</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Pelunasan invoice lebih awal INV-#2</div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>2 Jun 2025</span>
                </div>
                <div style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--danger)' }}>-10 Poin</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Terlambat membayar cicilan 1 hari</div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>20 Apr 2025</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
