import React, { useState } from 'react';
import { 
    BookOpen, 
    RefreshCcw, 
    PieChart, 
    PlusCircle, 
    Calculator,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Search,
    CreditCard,
    ArrowRightLeft,
    FileText,
    Store,
    Database,
    Settings,
    ShieldCheck
} from 'lucide-react';

const PanduanPage = () => {
    const [activeSection, setActiveSection] = useState('pengantar');
    const [searchQuery, setSearchQuery] = useState('');

    const simStateInitial = {
        type: 'SETOR_TUNAI',
        amount: 100000
    };
    const [simState, setSimState] = useState(simStateInitial);

    const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    const getSimResult = () => {
        let debitCoa = '', debitName = '', creditCoa = '', creditName = '', notes = '';
        switch (simState.type) {
            case 'SETOR_TUNAI':
                debitCoa = '1101'; debitName = 'Kas Utama (Loket Teller)';
                creditCoa = '2100'; creditName = 'Tabungan Santri (Wadiah)';
                notes = 'Kas fisik bertambah di loket teller (Debit). Di sisi lain, titipan atau kewajiban bank kepada santri bertambah (Kredit).';
                break;
            case 'TARIK_TUNAI':
                debitCoa = '2100'; debitName = 'Tabungan Santri (Wadiah)';
                creditCoa = '1101'; creditName = 'Kas Utama (Loket Teller)';
                notes = 'Kewajiban bank kepada santri berkurang (Debit). Kas fisik dikeluarkan dan diserahkan ke santri (Kredit).';
                break;
            case 'BAYAR_SYAHRIYAH':
                debitCoa = '2100'; debitName = 'Tabungan Santri (Wadiah)';
                creditCoa = '4300'; creditName = 'Pendapatan Bulanan (Syahriyah)';
                notes = 'Saldo tabungan santri dipotong (Debit). Uang tersebut secara sah menjadi Pendapatan pesantren (Kredit).';
                break;
            case 'JAJAN_KOPERASI':
                debitCoa = '2100'; debitName = 'Tabungan Santri (Wadiah)';
                creditCoa = '1101'; creditName = 'Kas Outlet Koperasi';
                notes = 'Saldo santri berkurang saat tap kartu (Debit). Uang/piutang masuk ke dalam penampungan kasir koperasi (Kredit).';
                break;
            case 'BAYAR_DAFTAR':
                debitCoa = '1101'; debitName = 'Kas Utama (Loket Teller)';
                creditCoa = '4100'; creditName = 'Pendapatan Pendaftaran Santri Baru';
                notes = 'Penerimaan uang fisik secara langsung dari wali (Debit) diakui sebagai Pendapatan pesantren (Kredit).';
                break;
            default:
                break;
        }

        return { debitCoa, debitName, creditCoa, creditName, notes };
    };

    const simResult = getSimResult();

    const sections = [
        { id: 'pengantar', title: 'Konsep & Alur Dana', icon: <BookOpen className="w-4 h-4" />, category: 'Core' },
        { id: 'master-data', title: 'Manajemen Master Data', icon: <Database className="w-4 h-4" />, category: 'Core' },
        { id: 'coa', title: 'Panduan COA', icon: <PieChart className="w-4 h-4" />, category: 'Akuntansi' },
        { id: 'tambah-coa', title: 'Tambah Data Baru', icon: <PlusCircle className="w-4 h-4" />, category: 'Akuntansi' },
        { id: 'simulator', title: 'Simulator Jurnal', icon: <Calculator className="w-4 h-4" />, category: 'Akuntansi' },
        { id: 'rekonsiliasi', title: 'Rekonsiliasi Wadiah', icon: <CheckCircle2 className="w-4 h-4" />, category: 'Akuntansi' },
        { id: 'operasional', title: 'Operasional Teller', icon: <ArrowRightLeft className="w-4 h-4" />, category: 'Teller' },
        { id: 'tagihan', title: 'Manajemen Tagihan', icon: <FileText className="w-4 h-4" />, category: 'Pembayaran' },
        { id: 'koperasi', title: 'Kasir Koperasi (RFID)', icon: <Store className="w-4 h-4" />, category: 'Eksternal' },
        { id: 'keamanan', title: 'Keamanan Sistem', icon: <ShieldCheck className="w-4 h-4" />, category: 'Keamanan' }
    ];

    const filteredSections = sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex flex-col lg:flex-row gap-5 pb-12">
            {/* Sidebar In-Page */}
            <div className="w-full lg:w-64 shrink-0">
                <div className="bg-white border border-slate-300 p-3.5 sticky top-4">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        Menu Panduan
                    </h3>
                    
                    <div className="relative mb-3">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari fitur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 text-xs focus:outline-none focus:border-blue-600 focus:bg-white"
                        />
                    </div>

                    <div className="space-y-0.5 border-t border-slate-200 pt-2">
                        {filteredSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium transition-colors text-left border-l-2 ${
                                    activeSection === section.id 
                                        ? 'bg-blue-50 text-blue-800 border-blue-600 font-semibold' 
                                        : 'text-slate-600 hover:bg-slate-50 border-transparent hover:text-slate-900'
                                }`}
                            >
                                {section.icon}
                                <span className="flex-1 truncate">{section.title}</span>
                            </button>
                        ))}
                        {filteredSections.length === 0 && (
                            <div className="text-xs text-slate-400 text-center py-4">Tidak ditemukan</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {/* Flat Professional Header */}
                <div className="bg-slate-900 border-l-4 border-blue-600 p-6 text-white mb-5">
                    <div className="flex items-center gap-2 text-xs text-blue-400 font-mono uppercase tracking-wider mb-1">
                        <span>Dokumentasi Sistem</span>
                        <span>/</span>
                        <span>Panduan Operasional</span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-1.5">
                        Buku Panduan & Akuntansi Bank Santri
                    </h1>
                    <p className="text-slate-300 text-xs md:text-sm max-w-3xl leading-relaxed">
                        Standar Prosedur Operasional (SOP) core banking pesantren: tata cara penggunaan rekening wadiah, aturan debet-kredit Chart of Accounts (COA), serta panduan langkah demi langkah seluruh modul.
                    </p>
                </div>

                {/* Section Content Rendering */}
                <div className="bg-white border border-slate-300 p-6 md:p-7">
                    {activeSection === 'pengantar' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Pengantar & Konsep Tabungan Santri</h2>
                                <p className="text-xs text-slate-500">Prinsip dasar akad syariah dan arsitektur tabungan santri</p>
                            </div>
                            
                            <div className="bg-slate-50 border-l-4 border-blue-600 p-3.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-1 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-blue-700" /> Prinsip Kunci Akuntansi
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    Uang tabungan santri yang disetor ke loket teller <strong>BUKAN PENDAPATAN</strong> bagi pesantren, 
                                    melainkan <strong>TITIPAN / KEWAJIBAN (Akad Wadiah Yad Dhamanah)</strong>. Pesantren berkewajiban mengembalikan atau menyalurkan uang tersebut sesuai instruksi santri atau wali.
                                </p>
                            </div>

                            <h3 className="font-bold text-slate-800 text-sm mt-5 mb-2">Glosarium Istilah Sistem</h3>
                            <div className="border border-slate-300 overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 uppercase font-semibold text-[11px]">
                                        <tr>
                                            <th className="px-3 py-2.5">Istilah Sistem</th>
                                            <th className="px-3 py-2.5">Padanan Bank Umum</th>
                                            <th className="px-3 py-2.5">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">Account Number</td>
                                            <td className="px-3 py-2.5 text-slate-700">No. Rekening</td>
                                            <td className="px-3 py-2.5 text-slate-600">Otomatis menggunakan <strong>NIS (Nomor Induk Santri)</strong>.</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">Card Number</td>
                                            <td className="px-3 py-2.5 text-slate-700">Kartu Debit</td>
                                            <td className="px-3 py-2.5 text-slate-600">UID RFID / NFC untuk tap transaksi di kasir koperasi.</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-mono font-semibold text-slate-900">COA 2100</td>
                                            <td className="px-3 py-2.5 text-slate-700">Dana Pihak Ketiga (DPK)</td>
                                            <td className="px-3 py-2.5 text-slate-600">Akun Kewajiban tempat bertumpuknya saldo seluruh santri.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'master-data' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Panduan Lengkap Master Data</h2>
                                <p className="text-xs text-slate-500">Keterangan kegunaan dan tata cara penggunaan seluruh konfigurasi fondasi Bank Santri</p>
                            </div>

                            <p className="text-xs text-slate-600">
                                Master Data adalah pusat parameter bisnis dan keuangan aplikasi. Berikut adalah penjelasan fungsi/kegunaan setiap fitur diikuti oleh panduan langkah demi langkah cara menggunakannya:
                            </p>

                            <div className="space-y-4">
                                {/* 1. Produk Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Produk Bank (Tabungan Santri)</h4>
                                    </div>

                                    {/* Kegunaan Fitur */}
                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Menetapkan skema dan aturan tabungan yang mengikat ke seluruh rekening santri, mencakup batas <strong>Saldo Mengendap</strong> (agar rekening tidak terkuras habis), <strong>Limit Tarik Harian</strong> (mengendalikan santri agar tidak konsumtif saat jajan di koperasi atau tarik tunai di loket), serta biaya administrasi bulanan.
                                        </p>
                                    </div>

                                    {/* Langkah-Langkah Penggunaan */}
                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Master Data &gt; Produk Bank</strong>.</li>
                                            <li>Klik tombol <strong>+ Tambah Produk</strong> di pojok kanan atas.</li>
                                            <li>Isi <strong>Kode Produk</strong> (contoh: <code>WDH</code>) dan <strong>Nama Produk</strong> (contoh: <code>Tabungan Wadiah Reguler</code>).</li>
                                            <li>Tentukan <strong>Saldo Mengendap</strong> (contoh: Rp 10.000 sebagai saldo minimum yang tidak bisa diambil).</li>
                                            <li>Tentukan <strong>Limit Tarik/Hari</strong> (contoh: Rp 25.000 untuk membatasi pengeluaran santri per hari, atau isi 0 jika tanpa batasan).</li>
                                            <li>Pastikan toggle status <strong>Aktif</strong> tercentang, lalu klik <strong>Simpan Produk</strong>.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 2. COA Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">COA Bank (Chart of Accounts)</h4>
                                    </div>

                                    {/* Kegunaan Fitur */}
                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Menyusun bagan akun buku besar akuntansi (<em>General Ledger</em>) 4 digit standar perbankan syariah. Akun-akun ini menampung seluruh pencatatan jurnal debet dan kredit otomatis dari transaksi setoran teller, penarikan, pembayaran tagihan, hingga belanja kasir kantin.
                                        </p>
                                    </div>

                                    {/* Langkah-Langkah Penggunaan */}
                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Master Data &gt; COA Bank</strong>.</li>
                                            <li>Klik tombol <strong>+ Tambah COA</strong> di pojok kanan atas.</li>
                                            <li>Pilih <strong>Induk COA</strong> jika akun baru ini merupakan sub-rekening (contoh: anak dari <code>1100 Kas</code>). Tipe akun (Aset, Kewajiban, dll) akan otomatis menyesuaikan induknya.</li>
                                            <li>Masukkan <strong>Kode COA</strong> 4 digit (misal: <code>1102</code>) dan <strong>Nama Akun</strong> (misal: <code>Kas Teller Loket 2</code>).</li>
                                            <li>Pilih Level <strong>DETAIL</strong> dan pastikan status <strong>Postable: Ya</strong> (hanya akun berstatus Postable yang dapat menerima catatan jurnal transaksi).</li>
                                            <li>Klik <strong>Simpan COA</strong> untuk menyimpan ke dalam bagan akun.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 3. Master Rincian Transaksi */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Master Rincian Transaksi (Komponen Biaya)</h4>
                                    </div>

                                    {/* Kegunaan Fitur */}
                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Menjadi jembatan antara bahasa transaksi operasional kasir (seperti Uang Seragam, SPP Bulanan, Pembelian Kitab) dengan nomor akun akuntansi COA. Kasir cukup memilih nama pungutan tanpa perlu menghafal kode akun debet-kredit.
                                        </p>
                                    </div>

                                    {/* Langkah-Langkah Penggunaan */}
                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Master Data &gt; Rincian Transaksi</strong>.</li>
                                            <li>Klik tombol <strong>+ Tambah Rincian</strong>.</li>
                                            <li>Ketikkan <strong>Nama Rincian Biaya</strong> (contoh: <code>Uang Seragam Putri</code>).</li>
                                            <li>Tentukan <strong>Nominal Default</strong> (jika pungutan memiliki tarif tetap, misal: Rp 350.000).</li>
                                            <li>Di kolom <strong>COA Tujuan</strong>, cari dan pilih akun penampungnya (contoh: <code>4200 Pendapatan Operasional Tahunan</code>).</li>
                                            <li>Tentukan <strong>Posisi Entri</strong>: pilih <strong>Kredit</strong> jika akun tujuan adalah Pendapatan/Kewajiban, atau pilih <strong>Debit</strong> jika akun tujuan adalah Aset/Beban.</li>
                                            <li>Klik <strong>Simpan Rincian</strong>. Komponen ini langsung siap dipakai di kasir maupun di paket tagihan.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 4. Jenis Transaksi Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">4</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Jenis Transaksi Bank (Event Category & Rules)</h4>
                                    </div>

                                    {/* Kegunaan Fitur */}
                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Mengelompokkan kategori peristiwa transaksi sistem (seperti <code>TOPUP-SANTRI</code>, <code>WDR-SANTRI</code>, <code>BIAYA-REG</code>) serta mengonfigurasi aturan pemetaan (<em>Journal Rules</em>) berpasangan agar setiap transaksi otomatis menghasilkan jurnal seimbang.
                                        </p>
                                    </div>

                                    {/* Langkah-Langkah Penggunaan */}
                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Master Data &gt; Jenis Transaksi Bank</strong>.</li>
                                            <li>Klik <strong>+ Tambah Transaksi</strong>.</li>
                                            <li>Masukkan <strong>Kode</strong> (contoh: <code>BIAYA-REG</code>) dan <strong>Nama Transaksi</strong> (contoh: <code>Pembayaran Registrasi Santri Baru</code>).</li>
                                            <li>Pada bagian <strong>Aturan Jurnal</strong>, klik tombol Plus (+) untuk menambahkan baris pemetaan akun.</li>
                                            <li>Buat pasangan seimbang: 1 baris sisi <strong>Debit</strong> (misal menunjuk ke COA Kas Utama <code>1101</code>) dan 1 baris sisi <strong>Kredit</strong> (menunjuk ke Rincian Biaya Registrasi).</li>
                                            <li>Setelah aturan debet-kredit seimbang, klik <strong>Simpan Transaksi</strong>.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 5. Merchant Koperasi */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">5</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Merchant Koperasi (Kasir Eksternal)</h4>
                                    </div>

                                    {/* Kegunaan Fitur */}
                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Mendaftarkan kasir pihak ketiga (Kantin, Dapur, Toko Kitab) dan menerbitkan <strong>API Secret Key (X-Koperasi-Key)</strong> agar perangkat POS kasir dapat memproses transaksi <em>cashless</em> pemotongan saldo tabungan santri via tap kartu RFID tanpa membutuhkan akses login teller perbankan.
                                        </p>
                                    </div>

                                    {/* Langkah-Langkah Penggunaan */}
                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Master Data &gt; Merchant Koperasi</strong> (atau dari menu Koperasi & Eksternal).</li>
                                            <li>Klik tombol <strong>+ Tambah Merchant</strong>.</li>
                                            <li>Ketikkan nama merchant (contoh: <code>Kantin Putra - Stand Minuman</code>) dan catatan lokasi.</li>
                                            <li>Klik Simpan. Sistem akan memunculkan modal berisi <strong>API Secret Key</strong> unik.</li>
                                            <li>Klik tombol <strong>Salin (Copy)</strong> dan masukkan key tersebut ke software POS kasir kantin.</li>
                                            <li>Jika mesin kasir diganti atau kunci terindikasi bocor, gunakan tombol <strong>Rotate Key</strong> untuk menerbitkan kunci baru dan menonaktifkan kunci lama.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 6. Pengaturan Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">6</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Pengaturan Bank (Konfigurasi Global)</h4>
                                    </div>

                                    {/* Kegunaan Fitur */}
                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Mengelola variabel dan parameter terpusat sistem, meliputi integrasi auto-provisioning profil santri & kartu RFID dengan server akademik SMPT, integrasi payment gateway Midtrans untuk setoran online, hingga jadwal jam makan dapur dan proteksi Anti-Double Tap.
                                        </p>
                                    </div>

                                    {/* Langkah-Langkah Penggunaan */}
                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Master Data &gt; Pengaturan Bank</strong>.</li>
                                            <li>Pilih kelompok konfigurasi:
                                                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                                                    <li><strong>Pesantren:</strong> Mengatur URL server SMPT dan Secret Key untuk sinkronisasi otomatis.</li>
                                                    <li><strong>Midtrans:</strong> Mengatur Merchant ID, Client Key, dan Server Key untuk pembayaran virtual account online.</li>
                                                    <li><strong>Koperasi:</strong> Menentukan jam buka sesi makan dapur, tarif per porsi, dan mengaktifkan fitur pencegah dobel tap kartu santri.</li>
                                                </ul>
                                            </li>
                                            <li>Ubah nilai parameter pada kolom input yang dikehendaki.</li>
                                            <li>Klik tombol <strong>Simpan Pengaturan</strong> di pojok kanan atas untuk menerapkan perubahan seketika ke seluruh sistem.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'coa' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Panduan Memahami COA (Chart of Accounts)</h2>
                                <p className="text-xs text-slate-500">Standarisasi penomoran rekening akuntansi dan posisi normal</p>
                            </div>

                            <p className="text-xs text-slate-600">Setiap akun keuangan memiliki kode 4 digit dengan aturan hierarki level baku:</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                                <div className="bg-slate-50 border border-slate-300 p-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <strong className="text-slate-900 font-bold text-xs uppercase">1000 - ASET (Aktiva)</strong>
                                        <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5">NORMAL: DEBIT</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mb-2">Uang fisik riil milik pesantren/bank.</p>
                                    <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc font-mono">
                                        <li>1101 Kas Utama (Loket)</li>
                                        <li>1102 Rekening Bank</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-50 border border-slate-300 p-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <strong className="text-slate-900 font-bold text-xs uppercase">2000 - KEWAJIBAN (Pasiva)</strong>
                                        <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5">NORMAL: KREDIT</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mb-2">Uang titipan pihak ketiga (Santri).</p>
                                    <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc font-mono">
                                        <li>2100 Tabungan Santri (Wadiah)</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-50 border border-slate-300 p-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <strong className="text-slate-900 font-bold text-xs uppercase">4000 - PENDAPATAN</strong>
                                        <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5">NORMAL: KREDIT</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mb-2">Penerimaan atas jasa/tagihan murni milik pesantren.</p>
                                    <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc font-mono">
                                        <li>4100 Pendapatan Pendaftaran</li>
                                        <li>4200 Pendapatan Operasional Tahunan</li>
                                        <li>4300 Pendapatan Bulanan/Syahriyah</li>
                                    </ul>
                                </div>

                                <div className="bg-slate-50 border border-slate-300 p-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <strong className="text-slate-900 font-bold text-xs uppercase">5000 - BEBAN / BIAYA</strong>
                                        <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5">NORMAL: DEBIT</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mb-2">Pengeluaran operasional.</p>
                                    <ul className="text-xs text-slate-700 space-y-1 pl-4 list-disc font-mono">
                                        <li>5100 Beban Operasional Bank</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'tambah-coa' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Panduan Menambah Pungutan / Tagihan Baru</h2>
                                <p className="text-xs text-slate-500">Keterangan kegunaan dan alur langkah demi langkah agar pembukuan tetap tertib</p>
                            </div>

                            <div className="bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Membuat dan mendaftarkan jenis tagihan baru santri (seperti Biaya Ujian, Uang Kitab, Gedung Baru, atau Kajian Ramadhan) ke dalam sistem secara tertib akuntansi, sehingga uang masuk otomatis tercatat sebagai <strong>Pendapatan Pesantren (COA Kepala 4)</strong> tanpa merusak saldo titipan tabungan wadiah santri.
                                </p>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-600 p-3.5 text-xs text-amber-900">
                                <strong>ATURAN EMAS AKUNTANSI:</strong> Jangan pernah memetakan jenis pungutan santri langsung ke akun Tabungan (2100) atau Kas (1101) di <i>Master Rincian Transaksi</i>. <br/>
                                Pungutan wajib diarahkan ke <strong>COA PENDAPATAN (Kepala 4)</strong>. Sistem secara otomatis mendebit saldo tabungan santri sebagai akun lawannya saat pembayaran.
                            </div>

                            <div>
                                <span className="font-bold text-slate-900 text-xs uppercase block mb-2">Langkah Demi Langkah: Studi Kasus "Biaya Kajian Ramadhan"</span>
                                
                                <div className="space-y-3">
                                    <div className="p-3.5 border border-slate-300 bg-white">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                                            <h4 className="font-bold text-xs text-slate-900 uppercase">Tambahkan COA Pendapatan Baru</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 pl-7">
                                            Buka menu <b>Master Data &gt; COA Bank</b>. Klik <strong>+ Tambah COA</strong>, buat sub-akun pendapatan baru (misal: <code>4205 - Pendapatan Kajian Ramadhan</code>) di bawah parent Pendapatan Operasional. Centang status <strong>Postable: Ya</strong>.
                                        </p>
                                    </div>

                                    <div className="p-3.5 border border-slate-300 bg-white">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                                            <h4 className="font-bold text-xs text-slate-900 uppercase">Daftarkan di Master Rincian Transaksi</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 pl-7">
                                            Buka menu <b>Master Data &gt; Rincian Transaksi</b>. Klik <strong>+ Tambah Rincian</strong>. Masukkan Nama: <code>Biaya Kajian Ramadhan</code>, pilih COA Tujuan: <code>4205</code>, Posisi Entri: <code>Kredit</code>, dan tentukan tarif defaultnya.
                                        </p>
                                    </div>

                                    <div className="p-3.5 border border-slate-300 bg-white">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                                            <h4 className="font-bold text-xs text-slate-900 uppercase">Sematkan ke Paket Tagihan</h4>
                                        </div>
                                        <p className="text-xs text-slate-600 pl-7">
                                            Buka menu <b>Pembayaran & Tagihan &gt; Paket Pembayaran</b>. Tambahkan atau edit paket yang bersangkutan, lalu masukkan komponen rincian "Biaya Kajian Ramadhan" tersebut ke dalam item tagihan.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'simulator' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Simulator Jurnal Otomatis</h2>
                                <p className="text-xs text-slate-500">Pratinjau pembentukan Double-Entry Ledger secara real-time</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Skenario Transaksi</label>
                                        <select 
                                            className="w-full border border-slate-300 text-xs py-2 px-2.5 bg-white focus:outline-none focus:border-blue-600"
                                            value={simState.type}
                                            onChange={(e) => setSimState({...simState, type: e.target.value})}
                                        >
                                            <option value="SETOR_TUNAI">Setoran Tunai (Wali setor uang saku)</option>
                                            <option value="TARIK_TUNAI">Tarik Tunai (Santri ambil uang saku)</option>
                                            <option value="BAYAR_SYAHRIYAH">Sistem Memotong Saldo untuk Bayar Syahriyah</option>
                                            <option value="JAJAN_KOPERASI">Santri Tap RFID Jajan di Kantin</option>
                                            <option value="BAYAR_DAFTAR">Wali Bayar Tunai Uang Pendaftaran</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Nominal (Rp)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border border-slate-300 text-xs py-2 px-2.5 bg-white focus:outline-none focus:border-blue-600 font-mono"
                                            value={simState.amount}
                                            onChange={(e) => setSimState({...simState, amount: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-4 text-slate-200 font-mono text-xs border border-slate-800">
                                    <div className="text-emerald-400 font-bold mb-3 pb-2 border-b border-slate-800 flex items-center gap-1.5 uppercase text-[11px]">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Double-Entry Jurnal Terbentuk
                                    </div>
                                    
                                    <div className="space-y-2 mb-3">
                                        <div className="flex justify-between items-center text-blue-300">
                                            <span>[DEBIT] {simResult.debitCoa} - {simResult.debitName}</span>
                                            <span className="font-semibold">{formatRp(simState.amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-300 pl-4 md:pl-6">
                                            <span>[KREDIT] {simResult.creditCoa} - {simResult.creditName}</span>
                                            <span className="font-semibold">{formatRp(simState.amount)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800 p-2.5 border-t border-slate-700 text-slate-400 font-sans text-xs leading-relaxed">
                                        <strong>Logika: </strong>{simResult.notes}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'rekonsiliasi' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Rekonsiliasi Saldo Wadiah</h2>
                                <p className="text-xs text-slate-500">Audit kepatuhan akuntansi dan pencegahan selisih kas</p>
                            </div>

                            <div className="bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Memverifikasi dan mencocokkan secara otomatis antara total saldo fisik milik seluruh rekening santri dengan nilai saldo buku besar akuntansi pada akun Titipan Wadiah (COA 2100). Fitur ini menjamin tidak ada kebocoran dana dan mendeteksi jika ada transaksi gantung yang belum terjurnal.
                                </p>
                            </div>

                            <div>
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                    <li>Buka menu <strong>Laporan &gt; Rekonsiliasi Saldo</strong>.</li>
                                    <li>Tinjau panel perbandingan: <strong>Total Saldo Riil Rekening Nasabah</strong> vs <strong>Total Saldo Buku Besar COA 2100</strong>.</li>
                                    <li>Jika kedua nilai bernilai sama (Selisih = Rp 0), status menunjukkan <strong>Balanced / Seimbang</strong>.</li>
                                    <li>Jika terdapat selisih, tabel di bawah akan memunculkan daftar nomor referensi transaksi yang jurnalnya belum terposting sempurna.</li>
                                    <li>Klik tombol <strong>Sync / Perbaiki Jurnal Otomatis</strong> untuk merekonstruksi kembali jurnal transaksi yang hilang.</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {activeSection === 'operasional' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Panduan Lengkap Operasional Bank (Teller)</h2>
                                <p className="text-xs text-slate-500">Keterangan kegunaan dan tata cara penggunaan 7 fitur operasional loket harian</p>
                            </div>

                            <p className="text-xs text-slate-600">
                                Modul Operasional Bank adalah area kerja harian teller dan staf keuangan untuk melayani santri dan wali. Berikut adalah keterangan kegunaan setiap fitur diikuti langkah-langkah penggunaannya:
                            </p>

                            <div className="space-y-4">
                                {/* 1. Transaksi Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Transaksi Bank (Monitoring & Reversal)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Memantau seluruh transaksi yang terjadi di seluruh loket teller, kasir kantin, dan transfer online secara real-time, mencetak ulang kuitansi transaksi lama, serta melakukan pembatalan resmi (<em>Reversal</em>) jika petugas salah menginput nominal/santri tanpa menghapus jejak audit.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Transaksi Bank</strong>.</li>
                                            <li>Gunakan kolom pencarian atau filter status (Success/Pending/Failed) untuk menemukan transaksi yang dicari.</li>
                                            <li>Klik tombol <strong>Detail</strong> pada baris transaksi untuk melihat informasi akun debet-kredit, channel, dan mencetak ulang kuitansi.</li>
                                            <li><strong>Cara Membatalkan (Reversal):</strong> Jika transaksi salah input, klik tombol <strong>Reverse</strong> di halaman detail, ketikkan alasan pembatalan (misal: "Salah input nominal"), lalu konfirmasi. Sistem otomatis mengembalikan saldo santri dan membuat jurnal pembalik.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 2. Entri Transaksi */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Entri Transaksi Manual</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Mencatat transaksi pembukuan khusus atau pemindahbukuan dana internal yang tidak melalui loket setor/tarik tunai umum, seperti koreksi saldo, penyaluran subsidi/beasiswa yayasan, atau dropping kas antar loket.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Entri Transaksi</strong>.</li>
                                            <li>Pilih <strong>Jenis Transaksi</strong> dari daftar dropdown sesuai peruntukan transaksi.</li>
                                            <li>Pilih <strong>Rekening Sumber</strong> (rekening yang dananya ditarik/berkurang) dan <strong>Rekening Tujuan</strong> (rekening penerima dana).</li>
                                            <li>Masukkan <strong>Nominal Transaksi</strong> dan tuliskan keterangan lengkap di kolom <strong>Deskripsi</strong>.</li>
                                            <li>Klik <strong>Simpan Transaksi</strong>. Sistem otomatis membukukan transaksi dan membentuk jurnal double-entry.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 3. Rekening Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Rekening Bank & Auto-Provisioning</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Menampilkan dan mengelola seluruh buku tabungan santri (nomor rekening = NIS), memantau saldo aktif, memblokir rekening jika kartu fisik hilang, serta secara otomatis membuat rekening baru (<em>Auto-Provisioning</em>) tersinkronisasi dengan server SMPT.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Rekening Bank</strong>.</li>
                                            <li>Ketikkan NIS atau Nama santri di kolom pencarian.</li>
                                            <li><strong>Proses Auto-Provisioning:</strong> Jika santri baru belum pernah membuka rekening, ketikkan NIS santri. Sistem otomatis menarik biodata santri dan nomor UID RFID dari SMPT, lalu langsung membuatkan rekening tabungan baru tanpa perlu pendaftaran manual.</li>
                                            <li>Klik baris santri untuk melihat rincian produk tabungan, limit harian, dan kontak wali santri.</li>
                                            <li><strong>Cara Memblokir Rekening:</strong> Jika kartu santri hilang atau santri telah mutasi/lulus, klik <strong>Edit Status</strong> dan ubah status rekening menjadi <strong>DIBLOKIR</strong> atau <strong>TUTUP</strong>.</li>
                                            <li><strong>Cetak Rekening Koran:</strong> Jika wali santri meminta rekapan transaksi, klik tombol <strong>Koran</strong> pada baris santri. Di jendela modal yang muncul, pilih rentang tanggal atau bulan yang diinginkan, lalu klik <strong>Cetak / Unduh PDF</strong>. Sistem akan menghasilkan dokumen resmi berisi saldo awal, mutasi debit-kredit, dan saldo akhir.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 4. Top-Up / Setor Tunai */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">4</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Top-Up / Setor Tunai</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Menerima setoran uang tunai di loket teller dari santri atau wali untuk mengisi saldo tabungan uang saku santri, atau sekaligus langsung melunasi tagihan pesantren (seperti SPP/Syahriyah) dalam satu kali transaksi terpadu.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Top-Up / Setor Tunai</strong>.</li>
                                            <li>Tempelkan kartu RFID santri ke reader atau cari berdasarkan NIS/Nama santri.</li>
                                            <li>Hitung uang fisik yang diserahkan dan masukkan nominalnya di kolom <strong>Jumlah Setoran</strong>.</li>
                                            <li><strong>Setoran Plus Pelunasan Tagihan:</strong> Jika uang setoran ditujukan untuk melunasi tagihan (misal Syahriyah), pilih nama tagihan pada dropdown <strong>Paket Pembayaran</strong>. Sistem akan otomatis memotong tagihan dan memasukkan sisanya ke saldo uang saku santri.</li>
                                            <li>Klik tombol <strong>Proses Setoran Tunai</strong>.</li>
                                            <li>Serahkan kuitansi/struk bukti setoran kepada wali atau santri.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 5. Tarik Tunai */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">5</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Tarik Tunai (Pencairan Uang Saku)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Melayani santri yang ingin mencairkan uang saku tunai di loket teller dengan proteksi otomatis terhadap <strong>Saldo Mengendap</strong> (agar saldo tidak habis) dan <strong>Limit Tarik Harian</strong> (sistem menghitung total tarik tunai + jajan santri hari ini agar tidak melebihi kuota).
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Tarik Tunai</strong>.</li>
                                            <li>Scan kartu RFID atau ketikkan NIS santri.</li>
                                            <li>Periksa ringkasan yang muncul: Saldo Aktif, Total Belanja Hari Ini, dan <strong>Maksimal Penarikan yang Diizinkan</strong>.</li>
                                            <li>Masukkan nominal penarikan yang diminta santri (sistem otomatis menolak jika melebihi sisa limit hari ini atau melanggar saldo mengendap).</li>
                                            <li>Klik tombol <strong>Proses Penarikan</strong>.</li>
                                            <li>Ambil uang tunai dari laci kas, serahkan ke santri, dan mintakan tanda tangan santri pada slip penarikan.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 6. Transfer Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">6</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Transfer Bank Antar Santri</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Memindahkan saldo tabungan dari satu rekening santri ke rekening santri lain (contoh: kiriman dari kakak ke adik atau antar santri) secara instan, tanpa biaya admin, dan tercatat rapi di mutasi kedua santri tanpa melibatkan uang tunai fisik.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Transfer Bank</strong>.</li>
                                            <li>Pilih atau cari rekening <strong>Santri Pengirim</strong> (sistem akan langsung memverifikasi saldo cukup).</li>
                                            <li>Pilih atau cari rekening <strong>Santri Penerima</strong>.</li>
                                            <li>Masukkan nominal transfer dan isi kolom <strong>Keterangan / Berita</strong> (misal: "Uang saku adik").</li>
                                            <li>Klik tombol <strong>Proses Transfer</strong>. Saldo rekening pengirim berkurang dan saldo rekening penerima bertambah detik itu juga.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 7. Mutasi Rekening */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">7</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Mutasi Rekening (Rekening Koran)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Buku tabungan digital untuk satu santri spesifik. Menampilkan catatan kronologis keluar-masuk dana (setoran, tarikan, belanja kantin, transfer) beserta saldo berjalan, dan dapat dicetak menjadi Rekening Koran resmi untuk wali santri.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Operasional Bank &gt; Mutasi Rekening</strong>.</li>
                                            <li>Cari nomor rekening atau NIS santri yang ingin dicetak mutasinya.</li>
                                            <li>Tentukan filter rentang tanggal (misal: 1 bulan terakhir atau semester berjalan).</li>
                                            <li>Tinjau rincian mutasi: Saldo Awal, kolom Debet (uang keluar), Kredit (uang masuk), dan Saldo Akhir.</li>
                                            <li>Klik tombol <strong>Cetak Rekening Koran</strong> di bagian atas untuk mencetak lembar kuitansi resmi atau menyimpannya dalam format PDF.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'tagihan' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Manajemen Tagihan & Uang Saku</h2>
                                <p className="text-xs text-slate-500">Pemisahan otomatis antara biaya institusi dan hak uang saku santri</p>
                            </div>

                            <div className="bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Menyusun paket tagihan bulanan (Syahriyah) atau pendaftaran dengan kemampuan memisahkan antara biaya operasional milik pesantren (seperti SPP dan uang makan) dengan uang saku murni santri. Sistem menjamin uang saku tidak dipotong untuk biaya lain dan tetap aman mengendap di kartu RFID santri.
                                </p>
                            </div>

                            <div>
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                    <li>Buka menu <strong>Pembayaran & Tagihan &gt; Paket Pembayaran</strong>.</li>
                                    <li>Klik tombol <strong>+ Tambah Paket Pembayaran</strong>.</li>
                                    <li>Beri nama paket (misal: <code>Tagihan Bulanan Santri Reguler</code>) dan pilih periode tagihan.</li>
                                    <li>Tambahkan rincian komponen biaya:
                                        <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-500">
                                            <li>Untuk komponen SPP/Makan: Biarkan toggle <strong>Is Saku</strong> MATI. (Dana akan dipotong menjadi pendapatan pesantren).</li>
                                            <li>Untuk komponen Uang Saku: Aktifkan toggle <strong>Is Saku</strong> MENYALA. (Dana tidak dipotong, melainkan dikreditkan ke saldo kartu santri).</li>
                                        </ul>
                                    </li>
                                    <li>Klik <strong>Simpan Paket</strong>. Saat wali santri membayar paket ini melalui teller atau Virtual Account, sistem langsung mengeksekusi pemisahan dana tersebut secara otomatis.</li>
                                </ol>
                            </div>

                            <div className="border border-slate-300 overflow-x-auto mt-3">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 uppercase font-semibold text-[11px]">
                                        <tr>
                                            <th className="px-3 py-2.5">Komponen Tagihan</th>
                                            <th className="px-3 py-2.5">Status Pengaturan</th>
                                            <th className="px-3 py-2.5">Perlakuan Akuntansi Sistem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-medium text-slate-900">Uang Makan & SPP</td>
                                            <td className="px-3 py-2.5"><span className="bg-slate-200 text-slate-800 font-mono text-[10px] font-bold px-1.5 py-0.5">BUKAN SAKU</span></td>
                                            <td className="px-3 py-2.5 text-slate-600">Dipotong dari saldo dan diakui sah sebagai Pendapatan Pesantren (COA Kepala 4).</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-medium text-slate-900">Uang Saku Pegangan</td>
                                            <td className="px-3 py-2.5"><span className="bg-blue-100 text-blue-800 font-mono text-[10px] font-bold px-1.5 py-0.5">UANG SAKU</span></td>
                                            <td className="px-3 py-2.5 text-slate-600"><strong>TIDAK DIPOTONG</strong>. Dana tetap mengendap di rekening santri dan siap dibelanjakan via kartu RFID.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'koperasi' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Integrasi Eksternal (Kasir Koperasi RFID)</h2>
                                <p className="text-xs text-slate-500">Tata cara operasional transaksi belanja non-tunai di kantin dan koperasi</p>
                            </div>

                            <div className="bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Menghubungkan mesin kasir toko/kantin pihak ketiga dengan server Bank Santri. Santri dapat jajan cukup dengan menempelkan kartu identitas RFID tanpa menggunakan uang tunai fisik yang rawan hilang atau dicuri, dengan validasi kuota batas belanja harian yang diawasi otomatis oleh sistem.
                                </p>
                            </div>

                            <div>
                                <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-2">
                                    <li>
                                        <strong>Pendaftaran Outlet Kasir:</strong>
                                        <p className="text-slate-500 mt-0.5">Admin bank membuka menu <strong>Master Data &gt; Merchant Koperasi</strong>, menambahkan outlet kantin baru, dan menyalin <strong>API Secret Key (X-Koperasi-Key)</strong>.</p>
                                    </li>
                                    <li>
                                        <strong>Pemasangan di Mesin POS Kasir:</strong>
                                        <p className="text-slate-500 mt-0.5">Petugas kantin membuka aplikasi kasir POS dan memasukkan API Secret Key tersebut di pengaturan koneksi tanpa perlu login akun teller.</p>
                                    </li>
                                    <li>
                                        <strong>Pelayanan Transaksi Jajan:</strong>
                                        <p className="text-slate-500 mt-0.5">Kasir menginput barang-barang yang dibeli santri hingga total belanja terhitung.</p>
                                    </li>
                                    <li>
                                        <strong>Verifikasi Tap Kartu RFID:</strong>
                                        <p className="text-slate-500 mt-0.5">Santri menempelkan kartu ke RFID reader. Server Bank Santri langsung memverifikasi secara real-time: status rekening aktif, sisa saldo mencukupi di atas saldo mengendap, dan total belanja belum melebihi limit tarik harian.</p>
                                    </li>
                                    <li>
                                        <strong>Struk & Pencatatan:</strong>
                                        <p className="text-slate-500 mt-0.5">Jika valid, saldo tabungan santri terpotong detik itu juga dan struk belanja tercetak otomatis di kasir kantin.</p>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {activeSection === 'keamanan' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Panduan Lengkap Keamanan Sistem</h2>
                                <p className="text-xs text-slate-500">Keterangan kegunaan dan tata cara penggunaan modul keamanan, hak akses, dan audit trail</p>
                            </div>

                            <p className="text-xs text-slate-600">
                                Modul Keamanan Sistem dirancang untuk memastikan operasional bank berjalan sesuai prinsip *Separation of Duties* (pemisahan kewenangan), mencegah manipulasi data, dan mencatat seluruh rekam jejak audit forensik perbankan.
                            </p>

                            <div className="space-y-4">
                                {/* 1. Manajemen User */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Manajemen User (Pengguna Aplikasi)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Mengelola akun staf dan petugas operasional bank pesantren. Fitur ini digunakan untuk mendaftarkan akun baru, menonaktifkan akun staf yang telah selesai bertugas, memperbarui profil, dan mereset kata sandi (password).
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Keamanan Sistem &gt; Manajemen User</strong>.</li>
                                            <li>Klik tombol <strong>+ Tambah User</strong> di pojok kanan atas.</li>
                                            <li>Isi data staf: Nama Lengkap, Alamat Email, Password, serta pilih <strong>Role</strong> (misal: Teller, Admin Bank, atau Pimpinan).</li>
                                            <li>Klik tombol <strong>Simpan User</strong>. Akun langsung aktif dan siap digunakan untuk login.</li>
                                            <li><strong>Reset Password / Nonaktifkan:</strong> Jika petugas lupa kata sandi atau mutasi kerja, klik tombol <strong>Edit</strong> pada baris user untuk mengganti password atau mengubah status akun menjadi non-aktif.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 2. Manajemen Menu */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Manajemen Menu (Navigasi Sidebar)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Mengatur struktur menu dan sub-menu yang tampil di bilah navigasi (sidebar) aplikasi secara dinamis dari database tanpa perlu merombak kode program.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Keamanan Sistem &gt; Manajemen Menu</strong>.</li>
                                            <li>Tinjau daftar hierarki menu utama dan sub-menunya.</li>
                                            <li>Klik <strong>+ Tambah Menu</strong> untuk mendaftarkan menu baru.</li>
                                            <li>Isi Nama Menu, Rute URL Path (contoh: <code>/panduan</code>), Icon, dan tentukan apakah menu ini berdiri sendiri atau memiliki Menu Induk (Parent).</li>
                                            <li>Tentukan nomor urutan (Order) agar posisi menu rapi di sidebar, lalu klik <strong>Simpan Menu</strong>.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 3. Role & Hak Akses */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Role & Hak Akses (Role-Based Access Control)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Menentukan peran kerja (Role) dalam operasional bank dan memetakan hak akses menu serta permission yang diizinkan untuk setiap peran. Ini mencegah teller mengakses laporan laba rugi atau mengubah pengaturan inti sistem.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Keamanan Sistem &gt; Role &amp; Hak Akses</strong>.</li>
                                            <li>Klik <strong>+ Tambah Role</strong> untuk mendefinisikan peran baru (misal: <code>supervisor_teller</code>), atau klik tombol <strong>Kelola Akses</strong> pada role yang sudah ada (Admin, Teller, Pimpinan).</li>
                                            <li>Centang menu dan modul apa saja yang boleh dilihat oleh role tersebut.</li>
                                            <li>Centang izin aksi teknis (Permission) yang diperbolehkan (misal: izinkan <code>reversal</code> hanya untuk Pimpinan/Admin).</li>
                                            <li>Klik <strong>Simpan Perubahan</strong>. Hak akses langsung berlaku seketika saat user membuka menu.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 4. Permission */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">4</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Permission (Katalog Izin Granular)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Daftar izin spesifik tingkat atomik yang mengontrol tindakan tertentu di dalam sistem (misal: <code>transaction.reverse</code>, <code>report.export</code>, <code>account.create</code>). Menjadi fondasi keamanan sebelum dieksekusi di API backend.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Keamanan Sistem &gt; Permission</strong>.</li>
                                            <li>Gunakan kolom pencarian untuk memeriksa apakah izin aksi tertentu sudah terdaftar di sistem.</li>
                                            <li>Jika ada pengembangan fitur baru yang butuh izin proteksi khusus, klik <strong>+ Tambah Permission</strong>.</li>
                                            <li>Gunakan konvensi penamaan standar: <code>nama_modul.nama_aksi</code> (contoh: <code>settings.update_limits</code>).</li>
                                            <li>Klik <strong>Simpan</strong>. Izin baru ini dapat langsung dipetakan ke role di menu <strong>Role &amp; Hak Akses</strong>.</li>
                                        </ol>
                                    </div>
                                </div>

                                {/* 5. Audit Trail */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">5</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Audit Trail (Rekam Jejak Aktivitas Forensik)</h4>
                                    </div>

                                    <div className="mb-3 bg-slate-50 border-l-2 border-blue-600 p-2.5">
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1">Kegunaan Fitur:</span>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            Merekam dan mengarsipkan setiap aktivitas pengguna di dalam aplikasi (siapa yang melakukan, kapan waktunya, tipe aksi, alamat IP, serta rincian data sebelum dan sesudah diedit). Fitur ini mutlak diperlukan untuk kepatuhan audit internal dan investigasi kesalahan/kecurangan.
                                        </p>
                                    </div>

                                    <div>
                                        <span className="font-bold text-slate-900 text-[11px] uppercase block mb-1.5">Langkah-Langkah Penggunaan:</span>
                                        <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                            <li>Buka menu <strong>Keamanan Sistem &gt; Audit Trail</strong>.</li>
                                            <li>Gunakan filter tanggal atau cari berdasarkan Nama Petugas/Subjek yang ingin diaudit.</li>
                                            <li>Periksa kolom aksi: <strong>CREATED</strong> (pembuatan data), <strong>UPDATED</strong> (perubahan data), atau <strong>DELETED</strong> (penghapusan).</li>
                                            <li>Klik tombol <strong>Detail Log</strong> pada baris aktivitas untuk melihat perbandingan mendalam antara <em>Data Lama (Old Attributes)</em> dengan <em>Data Baru (New Attributes)</em>.</li>
                                            <li>Pimpinan/Supervisor disarankan meninjau log ini secara berkala, terutama saat terjadi pembatalan transaksi (reversal) atau perubahan limit saldo.</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PanduanPage;
