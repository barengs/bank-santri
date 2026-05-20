import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MainLayout from './layouts/MainLayout';
import AuthMonitor from './components/AuthMonitor';
import Dashboard from './pages/Dashboard';
import NasabahPage from './pages/NasabahPage';
import NasabahDetailPage from './pages/NasabahDetailPage';
import TransaksiPage from './pages/TransaksiPage';
import MutasiPage from './pages/MutasiPage';
import LoginPage from './pages/LoginPage';

// Keuangan Pages
import PaketPembayaranPage from './pages/keuangan/PaketPembayaranPage';
import ProsesPembayaranPage from './pages/keuangan/ProsesPembayaranPage';
import VerifikasiTopupPage from './pages/keuangan/VerifikasiTopupPage';
import KasirKoperasiPage from './pages/keuangan/KasirKoperasiPage';
import TopUpCashPage from './pages/keuangan/TopUpCashPage';
import TransferBankPage from './pages/keuangan/TransferBankPage';
import TransactionDetailPage from './pages/keuangan/TransactionDetailPage';
import EntriTransaksiPage from './pages/keuangan/EntriTransaksiPage';
import KoperasiMerchantPage from './pages/keuangan/KoperasiMerchantPage';

// Master Pages
import ProductPage from './pages/master/ProductPage';
import COAPage from './pages/master/COAPage';
import TransactionTypePage from './pages/master/TransactionTypePage';
import TransactionItemPage from './pages/master/TransactionItemPage';
import SettingPage from './pages/master/SettingPage';
import UserManagementPage from './pages/security/UserManagementPage';
import MenuManagementPage from './pages/security/MenuManagementPage';
import RoleManagementPage from './pages/security/RoleManagementPage';
import PermissionManagementPage from './pages/security/PermissionManagementPage';
import AuditTrailPage from './pages/security/AuditTrailPage';

// Report Pages
import { 
    JournalPage, 
    TrialBalancePage, 
    FinancialStatementPage, 
    LaporanPage 
} from './pages/reports';

import '../css/app.css';

const App = () => {
    return (
        <Provider store={store}>
            <Router>
                <AuthMonitor>
                    <ToastContainer />
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="nasabah" element={<NasabahPage />} />
                            <Route path="nasabah/:accountNumber" element={<NasabahDetailPage />} />
                            <Route path="transaksi" element={<TransaksiPage />} />
                            <Route path="mutasi" element={<MutasiPage />} />
                            
                            {/* New Banking Routes */}
                            <Route path="paket-pembayaran" element={<PaketPembayaranPage />} />
                            <Route path="proses-pembayaran" element={<ProsesPembayaranPage />} />
                            <Route path="verifikasi-topup" element={<VerifikasiTopupPage />} />
                            <Route path="koperasi" element={<KasirKoperasiPage />} />
                            <Route path="topup" element={<TopUpCashPage />} />
                            <Route path="transfer" element={<TransferBankPage />} />
                            <Route path="entri-transaksi" element={<EntriTransaksiPage />} />
                            <Route path="transaksi-pendaftaran" element={<ProsesPembayaranPage />} /> {/* Shortcut */}

                            {/* Master Data Routes */}
                            <Route path="master">
                                <Route path="produk" element={<ProductPage />} />
                                <Route path="coa" element={<COAPage />} />
                                <Route path="rincian-transaksi" element={<TransactionItemPage />} />
                                <Route path="jenis-transaksi" element={<TransactionTypePage />} />
                                <Route path="user" element={<UserManagementPage />} />
                                <Route path="koperasi-merchant" element={<KoperasiMerchantPage />} />
                                <Route path="pengaturan" element={<SettingPage />} />
                            </Route>

                            {/* Security & RBAC Routes */}
                            <Route path="security">
                                <Route path="user" element={<UserManagementPage />} />
                                <Route path="menu" element={<MenuManagementPage />} />
                                <Route path="role" element={<RoleManagementPage />} />
                                <Route path="permission" element={<PermissionManagementPage />} />
                                <Route path="audit-trail" element={<AuditTrailPage />} />
                            </Route>

                            <Route path="konfigurasi" element={<SettingPage />} />
                            <Route path="transaksi/:id" element={<TransactionDetailPage />} />
                            
                            {/* Reports */}
                            <Route path="laporan" element={<LaporanPage />} />
                            <Route path="laporan/jurnal" element={<JournalPage />} />
                            <Route path="laporan/neraca-saldo" element={<TrialBalancePage />} />
                            <Route path="laporan/keuangan" element={<FinancialStatementPage />} />
                        </Route>
                    </Routes>
                </AuthMonitor>
            </Router>
        </Provider>
    );
};

const container = document.getElementById('app');
if (container) {
    if (!container._reactRoot) {
        container._reactRoot = createRoot(container);
    }
    container._reactRoot.render(<App />);
}
