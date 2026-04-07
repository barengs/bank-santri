import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import NasabahPage from './pages/NasabahPage';
import TransaksiPage from './pages/TransaksiPage';
import MutasiPage from './pages/MutasiPage';

import '../css/app.css';

const App = () => {
    return (
        <Provider store={store}>
            <Router>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="nasabah" element={<NasabahPage />} />
                        <Route path="transaksi" element={<TransaksiPage />} />
                        <Route path="mutasi" element={<MutasiPage />} />
                        <Route path="laporan" element={<MutasiPage />} /> {/* Shortcut to Mutasi to fill dummy */}
                        <Route path="konfigurasi" element={<div className="p-8">Konfigurasi Panel</div>} />
                    </Route>
                </Routes>
            </Router>
        </Provider>
    );
};

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
