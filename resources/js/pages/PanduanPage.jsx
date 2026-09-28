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
    Settings
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
        { id: 'koperasi', title: 'Kasir Koperasi (RFID)', icon: <Store className="w-4 h-4" />, category: 'Eksternal' }
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
                                <h2 className="text-lg font-bold text-slate-900">Panduan Penggunaan Master Data</h2>
                                <p className="text-xs text-slate-500">Langkah-langkah konfigurasi fondasi utama aplikasi Bank Santri</p>
                            </div>

                            <p className="text-xs text-slate-600">
                                Master Data adalah pusat pengaturan aplikasi. Berikut adalah panduan langkah demi langkah cara menggunakan dan mengonfigurasi setiap fitur di dalam modul Master Data.
                            </p>

                            <div className="space-y-3.5">
                                {/* Produk Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Cara Membuat Produk Bank (Tabungan)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Produk bank mengikat rekening santri ke aturan saldo dan limit transaksi.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                        <li>Buka menu <strong>Master Data &gt; Produk Bank</strong>.</li>
                                        <li>Klik tombol <strong>+ Tambah Produk</strong> di pojok kanan atas.</li>
                                        <li>Masukkan <strong>Kode</strong> (contoh: WDH) dan <strong>Nama Produk</strong> (contoh: Tabungan Wadiah).</li>
                                        <li>Tentukan <strong>Saldo Mengendap</strong> (batas uang yang tidak bisa ditarik, misal Rp 10.000).</li>
                                        <li>Tentukan <strong>Limit Tarik/Hari</strong> (batas nominal santri jajan atau tarik tunai per hari). Isi 0 untuk tanpa batas.</li>
                                        <li>Pastikan status <strong>Aktif</strong> tercentang, lalu klik <strong>Simpan Produk</strong>.</li>
                                    </ol>
                                </div>

                                {/* COA Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Cara Menambah COA Bank (Chart of Accounts)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Menambahkan rekening akuntansi buku besar (General Ledger) baru.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                        <li>Buka menu <strong>Master Data &gt; COA Bank</strong>.</li>
                                        <li>Klik tombol <strong>+ Tambah COA</strong>.</li>
                                        <li>Pilih <strong>Induk COA</strong> jika akun ini merupakan turunan (contoh: anak dari Kas 1100). Tipe (Aset/Kewajiban/dll) akan otomatis menyesuaikan induknya.</li>
                                        <li>Masukkan <strong>Kode COA</strong> (misal 1102) dan <strong>Nama Akun</strong> (misal Kas Teller B).</li>
                                        <li>Pilih Level <strong>DETAIL</strong> dan pastikan status <strong>Postable: Ya</strong> jika akun ini akan digunakan untuk transaksi (menerima jurnal debet/kredit).</li>
                                        <li>Klik <strong>Simpan COA</strong>.</li>
                                    </ol>
                                </div>

                                {/* Master Rincian Transaksi */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Cara Membuat Master Rincian Transaksi (Komponen Biaya)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Menjembatani operasional kasir dengan COA akuntansi untuk komponen seperti SPP, Uang Seragam, atau Kitab.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                        <li>Buka menu <strong>Master Data &gt; Rincian Transaksi</strong>.</li>
                                        <li>Klik <strong>+ Tambah Rincian</strong>.</li>
                                        <li>Isi <strong>Nama Rincian Biaya</strong> (contoh: Uang Pendaftaran Baru).</li>
                                        <li>Di kolom <strong>COA Tujuan</strong>, cari dan pilih akun buku besar penampungnya (contoh: 4100 Pendapatan Pendaftaran).</li>
                                        <li>Tentukan <strong>Posisi Entri</strong>. Jika akun tersebut adalah Pendapatan/Kewajiban, pilih <strong>Kredit</strong>. Jika Aset/Beban, pilih <strong>Debit</strong>.</li>
                                        <li>Klik <strong>Simpan Rincian</strong>. Rincian ini kini bisa digunakan di kasir atau paket pembayaran.</li>
                                    </ol>
                                </div>

                                {/* Jenis Transaksi Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">4</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Cara Membuat Kategori Transaksi & Aturan Jurnal</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Mengatur peristiwa transaksi (event) dan memetakan jurnal otomatisnya.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                        <li>Buka menu <strong>Master Data &gt; Jenis Transaksi Bank</strong>.</li>
                                        <li>Klik <strong>+ Tambah Transaksi</strong>.</li>
                                        <li>Masukkan <strong>Kode</strong> (contoh: BIAYA-REG) dan <strong>Nama Transaksi</strong> (contoh: Pembayaran Registrasi).</li>
                                        <li>Di bagian bawah form, tambahkan <strong>Aturan Jurnal</strong> dengan menekan tombol Plus (+).</li>
                                        <li>Anda harus membuat pasangan seimbang. Contoh: Tambah 1 baris Debit (menunjuk ke COA Kas Teller), dan 1 baris Kredit (menunjuk ke Rincian Biaya Pendaftaran).</li>
                                        <li>Setelah aturan debet-kredit seimbang, klik <strong>Simpan Transaksi</strong>.</li>
                                    </ol>
                                </div>

                                {/* Merchant Koperasi */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">5</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Cara Mendaftarkan Outlet Merchant Koperasi</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Mendaftarkan kasir eksternal (Kantin/Koperasi) agar bisa menerima pembayaran tap kartu (RFID) santri.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                        <li>Buka menu <strong>Master Data &gt; Merchant Koperasi</strong> (atau di bawah menu Pembayaran & Tagihan).</li>
                                        <li>Klik <strong>+ Tambah Merchant</strong>.</li>
                                        <li>Ketikkan nama merchant (contoh: Kantin Putra - Nasi Goreng).</li>
                                        <li>Klik Simpan. Sistem akan memunculkan popup berisi <strong>API Secret Key (X-Koperasi-Key)</strong>.</li>
                                        <li>Klik tombol Salin (Copy) dan masukkan kunci tersebut ke sistem kasir/POS di kantin agar terhubung ke server bank santri.</li>
                                        <li>Gunakan tombol <strong>Rotate Key</strong> jika kunci bocor atau perlu di-reset.</li>
                                    </ol>
                                </div>

                                {/* Pengaturan Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">6</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Cara Mengubah Pengaturan Konfigurasi Global</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Mengelola variabel sistem yang mempengaruhi operasional bank secara keseluruhan.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1.5">
                                        <li>Buka menu <strong>Master Data &gt; Pengaturan Bank</strong>.</li>
                                        <li>Form terbagi menjadi beberapa grup: <strong>Pesantren</strong> (untuk integrasi sinkronisasi data dengan SMPT), <strong>Midtrans</strong> (gateway), dan <strong>Koperasi</strong> (batasan jam makan).</li>
                                        <li>Ubah nilai di kolom yang sesuai, contohnya mengedit tarif sekali makan di kantin atau mematikan fitur Anti-Double Tap.</li>
                                        <li>Klik <strong>Simpan Pengaturan</strong> di pojok kanan atas untuk menerapkan perubahan ke seluruh sistem secara real-time.</li>
                                    </ol>
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
                                <h2 className="text-lg font-bold text-slate-900">Menambah Pungutan / Tagihan Baru</h2>
                                <p className="text-xs text-slate-500">Alur yang tepat agar pembukuan tidak berantakan</p>
                            </div>

                            <div className="bg-amber-50 border-l-4 border-amber-600 p-3.5 text-xs text-amber-900">
                                <strong>ATURAN EMAS:</strong> Jangan pernah memetakan jenis pungutan santri langsung ke akun Tabungan (2100) atau Kas (1101) di <i>Master Rincian Transaksi</i>. <br/>
                                Pungutan wajib diarahkan ke <strong>COA PENDAPATAN (Kepala 4)</strong>. Sistem secara otomatis mendebit saldo tabungan santri sebagai akun lawannya saat pembayaran.
                            </div>

                            <h3 className="font-bold text-slate-800 text-sm mt-4">Studi Kasus: Menambahkan "Biaya Kajian Ramadhan"</h3>
                            
                            <div className="space-y-3">
                                <div className="flex gap-3 p-3.5 border border-slate-300 bg-white">
                                    <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">1</div>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-900 uppercase">Tambahkan COA Pendapatan</h4>
                                        <p className="text-xs text-slate-600 mt-1">Buka menu <b>Master Data &gt; COA Bank</b>. Tambahkan sub-akun pendapatan baru (misal: <code>4205 - Pendapatan Kajian Ramadhan</code>) di bawah parent Pendapatan Operasional. Centang <i>Postable</i>.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 p-3.5 border border-slate-300 bg-white">
                                    <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">2</div>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-900 uppercase">Daftarkan di Master Rincian Transaksi</h4>
                                        <p className="text-xs text-slate-600 mt-1">Buka menu <b>Master Data &gt; Rincian Transaksi</b>. Buat item baru dengan COA Code: <code>4205</code>, Entry Type: <code>Kredit</code>, dan tentukan nominalnya.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 p-3.5 border border-slate-300 bg-white">
                                    <div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-xs shrink-0">3</div>
                                    <div>
                                        <h4 className="font-bold text-xs text-slate-900 uppercase">Sematkan ke Paket Tagihan</h4>
                                        <p className="text-xs text-slate-600 mt-1">Buka menu <b>Tagihan &gt; Paket Pembayaran</b>. Edit items pada paket yang bersangkutan, masukkan rincian "Biaya Kajian Ramadhan" tersebut.</p>
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
                                <p className="text-xs text-slate-500">Mencegah kebocoran dan selisih buku akuntansi</p>
                            </div>

                            <p className="text-xs text-slate-600">
                                Fitur audit untuk memastikan Total Saldo riil milik seluruh santri <strong>sama persis</strong> dengan Total Saldo Buku Besar (COA 2100).
                            </p>

                            <div className="bg-slate-50 border border-slate-300 p-4">
                                <h4 className="font-bold text-slate-900 text-xs uppercase mb-2">Jika Ditemukan Selisih:</h4>
                                <ol className="text-xs text-slate-700 space-y-1.5 pl-4 list-decimal">
                                    <li>Buka menu <b>Laporan &gt; Rekonsiliasi Saldo</b>.</li>
                                    <li>Sistem akan mendeteksi baris transaksi mana yang jurnal ledger-nya hilang atau belum terbentuk.</li>
                                    <li>Klik tombol <b>Sync / Perbaiki Jurnal Otomatis</b>.</li>
                                    <li>Sistem akan merekonstruksi ulang pasangan jurnal sesuai mutasi saldo santri.</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {activeSection === 'operasional' && (
                        <div className="space-y-5">
                            <div className="border-b border-slate-200 pb-3">
                                <h2 className="text-lg font-bold text-slate-900">Panduan Lengkap Operasional Bank (Teller)</h2>
                                <p className="text-xs text-slate-500">Prosedur langkah demi langkah 7 fitur operasional loket harian</p>
                            </div>

                            <div className="space-y-3.5">
                                {/* 1. Transaksi Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">1</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Transaksi Bank (Monitoring & Reversal)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Layar pemantauan seluruh riwayat transaksi di sistem secara real-time.</p>
                                    <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                                        <li><strong>Pencarian:</strong> Filter data berdasarkan status, channel, atau nomor referensi.</li>
                                        <li><strong>Cetak Struk:</strong> Buka detail transaksi untuk mencetak kuitansi ulang.</li>
                                        <li><strong>Reversal (Pembatalan):</strong> Buka detail transaksi lalu klik <strong>Reverse</strong> untuk membatalkan kesalahan input dengan Jurnal Balik otomatis.</li>
                                    </ul>
                                </div>

                                {/* 2. Entri Transaksi */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">2</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Entri Transaksi Manual</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Formulir pemindahbukuan manual yang diatur oleh Jenis Transaksi.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
                                        <li>Pilih <strong>Jenis Transaksi</strong>.</li>
                                        <li>Pilih Rekening Sumber dan Rekening Tujuan jika berlaku.</li>
                                        <li>Input nominal dan deskripsi, lalu klik <strong>Simpan Transaksi</strong>.</li>
                                    </ol>
                                </div>

                                {/* 3. Rekening Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">3</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Daftar Rekening Bank</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Pengelolaan data seluruh rekening tabungan santri.</p>
                                    <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                                        <li><strong>Auto-Provisioning:</strong> Jika mencari NIS santri dan rekening belum ada, sistem langsung menarik profil & kartu RFID dari server SMPT dan membuatkan rekening baru.</li>
                                        <li><strong>Blokir Rekening:</strong> Ubah status menjadi "DIBLOKIR" jika kartu santri hilang.</li>
                                    </ul>
                                </div>

                                {/* 4. Top-Up / Setor Tunai */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">4</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Top-Up / Setor Tunai</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Prosedur penerimaan setoran uang tunai di loket teller.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
                                        <li>Scan kartu RFID atau cari santri berdasarkan NIS/Nama.</li>
                                        <li>Input nominal fisik uang yang diterima.</li>
                                        <li>Jika bertujuan melunasi tagihan (Syahriyah), <strong>pilih Dropdown Paket Pembayaran</strong> agar langsung lunas otomatis.</li>
                                        <li>Klik <strong>Proses Setoran</strong> dan cetak bukti transaksi.</li>
                                    </ol>
                                </div>

                                {/* 5. Tarik Tunai */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">5</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Tarik Tunai</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Pencairan uang saku santri dengan kontrol proteksi.</p>
                                    <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                                        <li><strong>Saldo Minimum:</strong> Saldo mengendap tidak bisa ditarik.</li>
                                        <li><strong>Limit Tarik Harian:</strong> Sistem memeriksa total tarikan & jajan hari ini. Menolak otomatis jika melewati batas.</li>
                                        <li>Serahkan uang fisik kepada santri dan cetak kuitansi.</li>
                                    </ul>
                                </div>

                                {/* 6. Transfer Bank */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">6</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Transfer Bank Antar Santri</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Pemindahan saldo instan antar santri tanpa biaya.</p>
                                    <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
                                        <li>Pilih Rekening Pengirim (sistem memverifikasi saldo).</li>
                                        <li>Pilih Rekening Tujuan.</li>
                                        <li>Input nominal dan keterangan, lalu klik <strong>Proses Transfer</strong>.</li>
                                    </ol>
                                </div>

                                {/* 7. Mutasi Rekening */}
                                <div className="p-4 border border-slate-300 bg-white">
                                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-2">
                                        <span className="w-5 h-5 bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold">7</span>
                                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">Mutasi Rekening (Rekening Koran)</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 mb-2">Buku tabungan elektronik untuk 1 santri spesifik.</p>
                                    <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
                                        <li>Menampilkan riwayat debit, kredit, dan saldo berjalan per santri.</li>
                                        <li>Tersedia tombol <strong>Cetak Rekening Koran</strong> untuk pelaporan ke wali santri.</li>
                                    </ul>
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

                            <p className="text-xs text-slate-600">Dalam paket bulanan seringkali terdiri dari biaya makan, SPP, dan uang saku. Sistem memisahkannya secara otomatis:</p>

                            <div className="border border-slate-300 overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-100 text-slate-800 border-b border-slate-300 uppercase font-semibold text-[11px]">
                                        <tr>
                                            <th className="px-3 py-2.5">Komponen Tagihan</th>
                                            <th className="px-3 py-2.5">Status</th>
                                            <th className="px-3 py-2.5">Perlakuan Sistem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-medium text-slate-900">Uang Makan Dapur</td>
                                            <td className="px-3 py-2.5"><span className="bg-slate-200 text-slate-800 font-mono text-[10px] font-bold px-1.5 py-0.5">BUKAN SAKU</span></td>
                                            <td className="px-3 py-2.5 text-slate-600">Dipotong dari saldo tabungan dan diakui sebagai Pendapatan Pesantren (COA 4).</td>
                                        </tr>
                                        <tr className="hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-medium text-slate-900">Uang Saku Pegangan</td>
                                            <td className="px-3 py-2.5"><span className="bg-blue-100 text-blue-800 font-mono text-[10px] font-bold px-1.5 py-0.5">UANG SAKU</span></td>
                                            <td className="px-3 py-2.5 text-slate-600"><strong>TIDAK DIPOTONG</strong>. Dana tetap berada di saldo rekening santri agar dapat dijajankan via RFID.</td>
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
                                <p className="text-xs text-slate-500">Konektivitas mesin POS kasir kantin dengan API Bank</p>
                            </div>

                            <p className="text-xs text-slate-600">
                                Mesin POS Kasir Koperasi tidak memerlukan login akun Teller. Sistem menggunakan <b>API Key (X-Koperasi-Key)</b> untuk menjembatani komunikasi.
                            </p>

                            <ol className="list-decimal pl-5 text-xs text-slate-700 space-y-2 mt-2">
                                <li><strong>Pendaftaran Outlet:</strong> Masuk ke menu <b>Master Data &gt; Merchant Koperasi</b>. Tambahkan outlet dan salin Secret Key yang dihasilkan.</li>
                                <li><strong>Implementasi di Kasir:</strong> Petugas kantin memasukkan Secret Key ke perangkat kasir POS.</li>
                                <li><strong>Validasi Real-Time:</strong> Saat kartu santri ditempelkan, Bank Santri langsung memverifikasi status aktif, saldo minimum, dan kuota limit harian santri sebelum mendebit saldo.</li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PanduanPage;
