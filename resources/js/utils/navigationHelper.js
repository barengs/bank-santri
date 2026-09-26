export const getRouteMeta = (pathname) => {
    if (pathname === '/') {
        return {
            title: 'Dasbor',
            section: 'Dasbor',
            crumbs: []
        };
    }

    if (pathname.startsWith('/nasabah/')) {
        return {
            title: 'Detail Rekening',
            section: 'Manajemen Rekening',
            crumbs: [
                { name: 'Manajemen Rekening', path: '/nasabah' },
                { name: 'Detail Rekening' }
            ]
        };
    }

    if (pathname === '/nasabah') {
        return {
            title: 'Manajemen Rekening',
            section: 'Manajemen Rekening',
            crumbs: [
                { name: 'Manajemen Rekening' },
                { name: 'Daftar Rekening' }
            ]
        };
    }

    if (pathname.startsWith('/transaksi/')) {
        return {
            title: 'Detail Transaksi',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan', path: '/transaksi' },
                { name: 'Riwayat Transaksi', path: '/transaksi' },
                { name: 'Detail Transaksi' }
            ]
        };
    }

    if (pathname === '/transaksi') {
        return {
            title: 'Riwayat Transaksi',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Riwayat Transaksi' }
            ]
        };
    }

    if (pathname === '/mutasi') {
        return {
            title: 'Mutasi Rekening',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Mutasi Rekening' }
            ]
        };
    }

    if (pathname === '/proses-pembayaran' || pathname === '/transaksi-pendaftaran') {
        return {
            title: 'Proses Pembayaran',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Proses Pembayaran' }
            ]
        };
    }

    if (pathname === '/paket-pembayaran') {
        return {
            title: 'Paket Pembayaran',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Paket Pembayaran' }
            ]
        };
    }

    if (pathname === '/verifikasi-topup') {
        return {
            title: 'Verifikasi Top-Up',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Verifikasi Top-Up' }
            ]
        };
    }

    if (pathname === '/topup') {
        return {
            title: 'Top-Up Tunai',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Top-Up Tunai' }
            ]
        };
    }

    if (pathname === '/tarik-tunai') {
        return {
            title: 'Penarikan Tunai',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Penarikan Tunai' }
            ]
        };
    }

    if (pathname === '/transfer') {
        return {
            title: 'Transfer Bank',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Transfer Bank' }
            ]
        };
    }

    if (pathname === '/entri-transaksi') {
        return {
            title: 'Entri Transaksi',
            section: 'Keuangan',
            crumbs: [
                { name: 'Keuangan' },
                { name: 'Entri Transaksi' }
            ]
        };
    }

    // Master
    if (pathname === '/master/produk') {
        return {
            title: 'Master Produk Tabungan',
            section: 'Data Master',
            crumbs: [
                { name: 'Data Master' },
                { name: 'Produk Tabungan' }
            ]
        };
    }

    if (pathname === '/master/coa') {
        return {
            title: 'Bagan Akun (COA)',
            section: 'Data Master',
            crumbs: [
                { name: 'Data Master' },
                { name: 'Chart of Accounts' }
            ]
        };
    }

    if (pathname === '/master/rincian-transaksi') {
        return {
            title: 'Rincian Transaksi',
            section: 'Data Master',
            crumbs: [
                { name: 'Data Master' },
                { name: 'Rincian Transaksi' }
            ]
        };
    }

    if (pathname === '/master/jenis-transaksi') {
        return {
            title: 'Jenis Transaksi & Rules',
            section: 'Data Master',
            crumbs: [
                { name: 'Data Master' },
                { name: 'Jenis Transaksi' }
            ]
        };
    }

    if (pathname === '/master/koperasi-merchant') {
        return {
            title: 'Merchant Koperasi',
            section: 'Data Master',
            crumbs: [
                { name: 'Data Master' },
                { name: 'Merchant Koperasi' }
            ]
        };
    }

    if (pathname === '/master/pengaturan' || pathname === '/konfigurasi') {
        return {
            title: 'Pengaturan Sistem',
            section: 'Pengaturan',
            crumbs: [
                { name: 'Pengaturan' },
                { name: 'Konfigurasi' }
            ]
        };
    }

    // Security
    if (pathname === '/security/user') {
        return {
            title: 'Manajemen Pengguna',
            section: 'Keamanan & Akses',
            crumbs: [
                { name: 'Keamanan & Akses' },
                { name: 'Pengguna' }
            ]
        };
    }

    if (pathname === '/security/menu') {
        return {
            title: 'Manajemen Menu',
            section: 'Keamanan & Akses',
            crumbs: [
                { name: 'Keamanan & Akses' },
                { name: 'Menu' }
            ]
        };
    }

    if (pathname === '/security/role') {
        return {
            title: 'Manajemen Role',
            section: 'Keamanan & Akses',
            crumbs: [
                { name: 'Keamanan & Akses' },
                { name: 'Role' }
            ]
        };
    }

    if (pathname === '/security/permission') {
        return {
            title: 'Manajemen Permission',
            section: 'Keamanan & Akses',
            crumbs: [
                { name: 'Keamanan & Akses' },
                { name: 'Permission' }
            ]
        };
    }

    if (pathname === '/security/audit-trail') {
        return {
            title: 'Audit Trail',
            section: 'Keamanan & Akses',
            crumbs: [
                { name: 'Keamanan & Akses' },
                { name: 'Audit Trail' }
            ]
        };
    }

    // Reports
    if (pathname === '/laporan') {
        return {
            title: 'Laporan Keuangan',
            section: 'Laporan',
            crumbs: [
                { name: 'Laporan' },
                { name: 'Ringkasan Laporan' }
            ]
        };
    }

    if (pathname === '/laporan/jurnal') {
        return {
            title: 'Jurnal Umum',
            section: 'Laporan',
            crumbs: [
                { name: 'Laporan', path: '/laporan' },
                { name: 'Jurnal Umum' }
            ]
        };
    }

    if (pathname === '/laporan/neraca-saldo') {
        return {
            title: 'Neraca Saldo',
            section: 'Laporan',
            crumbs: [
                { name: 'Laporan', path: '/laporan' },
                { name: 'Neraca Saldo' }
            ]
        };
    }

    if (pathname === '/laporan/keuangan') {
        return {
            title: 'Laporan Keuangan',
            section: 'Laporan',
            crumbs: [
                { name: 'Laporan', path: '/laporan' },
                { name: 'Laba Rugi & Neraca' }
            ]
        };
    }

    // Dynamic Fallback
    const segments = pathname.split('/').filter(Boolean);
    const lastSeg = segments[segments.length - 1] || 'Dashboard';
    const formatted = lastSeg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
        title: formatted,
        section: 'Aplikasi',
        crumbs: [{ name: formatted }]
    };
};
