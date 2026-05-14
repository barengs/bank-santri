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
import TransaksiPage from './pages/TransaksiPage';
import MutasiPage from './pages/MutasiPage';

// Keuangan Pages
import PaketPembayaranPage from './pages/keuangan/PaketPembayaranPage';
import ProsesPembayaranPage from './pages/keuangan/ProsesPembayaranPage';
import VerifikasiTopupPage from './pages/keuangan/VerifikasiTopupPage';
import KasirKoperasiPage from './pages/keuangan/KasirKoperasiPage';
import TopUpCashPage from './pages/keuangan/TopUpCashPage';
import TransferBankPage from './pages/keuangan/TransferBankPage';
import TransactionDetailPage from './pages/keuangan/TransactionDetailPage';
import EntriTransaksiPage from './pages/keuangan/EntriTransaksiPage';

// Master Pages
import ProductPage from './pages/master/ProductPage';
import COAPage from './pages/master/COAPage';
import TransactionTypePage from './pages/master/TransactionTypePage';
import TransactionItemPage from './pages/master/TransactionItemPage';
import SettingPage from './pages/master/SettingPage';

import '../css/app.css';

const App = () => {
    return (
        <Provider store={store}>
            <Router>
                <AuthMonitor>
                    <ToastContainer />
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="nasabah" element={<NasabahPage />} />
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

                            {/* Master Data Routes */}
                            <Route path="master">
                                <Route path="produk" element={<ProductPage />} />
                                <Route path="coa" element={<COAPage />} />
                                <Route path="rincian-transaksi" element={<TransactionItemPage />} />
                                <Route path="jenis-transaksi" element={<TransactionTypePage />} />
                                <Route path="pengaturan" element={<SettingPage />} />
                            </Route>

                            <Route path="konfigurasi" element={<SettingPage />} />
                            <Route path="transaksi/:id" element={<TransactionDetailPage />} />
                            <Route path="laporan" element={<MutasiPage />} /> 
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
