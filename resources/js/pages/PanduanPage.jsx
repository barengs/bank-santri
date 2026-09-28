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
    Store
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
        <div className="flex flex-col lg:flex-row gap-6 pb-12">
            {/* Sidebar In-Page */}
            <div className="w-full lg:w-64 shrink-0">
                <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        Menu Panduan
                    </h3>
                    
                    <div className="relative mb-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Cari panduan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        {filteredSections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                                    activeSection === section.id 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {section.icon}
                                <span className="flex-1 truncate">{section.title}</span>
                            </button>
                        ))}
                        {filteredSections.length === 0 && (
                            <div className="text-sm text-gray-400 text-center py-4">Tidak ditemukan</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white mb-6 relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                        <h1 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">Panduan Sistem Bank Santri</h1>
                        <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed">
                            Panduan operasional komprehensif untuk memahami sistem pembukuan 
                            <i> Double-Entry </i> syariah, penggunaan Chart of Accounts (COA), 
                            serta operasi teller dan kasir.
                        </p>
                    </div>
                </div>

                {/* Section Content Rendering */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
                    {activeSection === 'pengantar' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg"><BookOpen className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Pengantar & Konsep Tabungan</h2>
                                    <p className="text-sm text-gray-500">Memahami hakikat rekening santri dan akad syariah</p>
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg">
                                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Prinsip Kunci
                                </h4>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Uang tabungan santri yang disetor ke loket teller <strong>BUKAN PENDAPATAN</strong> bagi pesantren, 
                                    melainkan <strong>TITIPAN / KEWAJIBAN (Akad Wadiah Yad Dhamanah)</strong>. Pesantren berkewajiban mengembalikan atau menyalurkan uang tersebut sesuai instruksi santri/wali.
                                </p>
                            </div>

                            <h3 className="font-bold text-gray-800 mt-6 mb-3">Istilah dalam Sistem</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
                                    <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Istilah Sistem</th>
                                            <th className="px-4 py-3 font-semibold">Padanan Bank Umum</th>
                                            <th className="px-4 py-3 font-semibold">Keterangan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">Account Number</td>
                                            <td className="px-4 py-3 text-gray-600">No. Rekening</td>
                                            <td className="px-4 py-3 text-gray-600">Otomatis menggunakan <strong>NIS (Nomor Induk Santri)</strong>.</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">Card Number</td>
                                            <td className="px-4 py-3 text-gray-600">Kartu Debit</td>
                                            <td className="px-4 py-3 text-gray-600">UID RFID / NFC untuk tap jajan di koperasi.</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">COA 2100</td>
                                            <td className="px-4 py-3 text-gray-600">DPK (Dana Pihak Ke-3)</td>
                                            <td className="px-4 py-3 text-gray-600">Akun "Kewajiban" bertumpuknya saldo seluruh santri.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'coa' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg"><PieChart className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Panduan Memahami COA</h2>
                                    <p className="text-sm text-gray-500">Standarisasi penomoran Chart of Account (Akuntansi)</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600">Setiap akun keuangan memiliki kode 4 digit dengan aturan hierarki level. Penempatan akun yang salah akan berakibat fatal pada Neraca dan Laba Rugi.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className="text-blue-800 font-bold">1000 - ASET (Aktiva)</strong>
                                        <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded">NORMAL: DEBIT</span>
                                    </div>
                                    <p className="text-xs text-blue-600 mb-3">Uang fisik riil milik pesantren/bank.</p>
                                    <ul className="text-sm text-blue-900 space-y-1 pl-4 list-disc">
                                        <li><span className="font-mono bg-white px-1 rounded">1101</span> Kas Utama (Loket)</li>
                                        <li><span className="font-mono bg-white px-1 rounded">1102</span> Rekening Bank</li>
                                    </ul>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className="text-amber-800 font-bold">2000 - KEWAJIBAN (Pasiva)</strong>
                                        <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded">NORMAL: KREDIT</span>
                                    </div>
                                    <p className="text-xs text-amber-600 mb-3">Uang titipan pihak lain (Santri).</p>
                                    <ul className="text-sm text-amber-900 space-y-1 pl-4 list-disc">
                                        <li><span className="font-mono bg-white px-1 rounded">2100</span> Tabungan Santri (Wadiah)</li>
                                    </ul>
                                </div>

                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className="text-purple-800 font-bold">4000 - PENDAPATAN</strong>
                                        <span className="text-[10px] font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded">NORMAL: KREDIT</span>
                                    </div>
                                    <p className="text-xs text-purple-600 mb-3">Penerimaan atas jasa/tagihan murni milik pesantren.</p>
                                    <ul className="text-sm text-purple-900 space-y-1 pl-4 list-disc">
                                        <li><span className="font-mono bg-white px-1 rounded">4100</span> Pendapatan Pendaftaran</li>
                                        <li><span className="font-mono bg-white px-1 rounded">4200</span> Pdp. Operasional Tahunan</li>
                                        <li><span className="font-mono bg-white px-1 rounded">4300</span> Pdp. Bulanan/Syahriyah</li>
                                    </ul>
                                </div>

                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <strong className="text-rose-800 font-bold">5000 - BEBAN / BIAYA</strong>
                                        <span className="text-[10px] font-bold bg-rose-200 text-rose-800 px-2 py-1 rounded">NORMAL: DEBIT</span>
                                    </div>
                                    <p className="text-xs text-rose-600 mb-3">Pengeluaran yang menjadi beban institusi.</p>
                                    <ul className="text-sm text-rose-900 space-y-1 pl-4 list-disc">
                                        <li><span className="font-mono bg-white px-1 rounded">5100</span> Beban Operasional Bank</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'tambah-coa' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-lg"><PlusCircle className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Menambah Pungutan / Tagihan Baru</h2>
                                    <p className="text-sm text-gray-500">Alur yang tepat agar pembukuan tidak berantakan</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 text-sm">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-amber-900">
                                    <strong>ATURAN EMAS:</strong> Jangan pernah memetakan jenis pungutan (seperti uang seragam, asrama, dsb) langsung ke akun Tabungan (2100) atau Kas (1101) di <i>Master Rincian Transaksi</i>. <br/>
                                    <strong>Pungutan wajib diarahkan ke COA PENDAPATAN (Kepala 4).</strong> Sistem secara otomatis akan mendebit saldo tabungan santri sebagai akun lawannya.
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-800 text-lg mt-6">Skenario: Menambahkan "Biaya Kajian Ramadhan"</h3>
                            
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">1</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Tambahkan COA Pendapatan</h4>
                                        <p className="text-sm text-gray-600 mt-1">Buka menu <b>Master Data &gt; COA Bank</b>. Tambahkan sub-akun pendapatan baru (misal: <code>4205 - Pendapatan Kajian Ramadhan</code>) di bawah parent Pendapatan Operasional. Centang opsi <i>Postable</i>.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">2</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Daftarkan di Master Rincian Transaksi</h4>
                                        <p className="text-sm text-gray-600 mt-1">Buka menu <b>Master Data &gt; Rincian Transaksi</b>. Buat baru dengan COA Code: <code>4205</code>, Posisi/Entry Type: <code>Kredit</code>, dan set nominalnya.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">3</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">Masukkan ke Paket Tagihan</h4>
                                        <p className="text-sm text-gray-600 mt-1">Buka menu <b>Tagihan &gt; Paket Pembayaran</b>. Edit items pada paket bersangkutan, tambahkan rincian "Biaya Kajian Ramadhan" tersebut.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'simulator' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-slate-800 text-white rounded-lg"><Calculator className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Simulator Jurnal Otomatis</h2>
                                    <p className="text-sm text-gray-500">Cari tahu bagaimana sistem mencatat Ledger secara real-time</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Skenario Transaksi</label>
                                        <select 
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2 px-3 border bg-white"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                                        <input 
                                            type="number" 
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm py-2 px-3 border bg-white"
                                            value={simState.amount}
                                            onChange={(e) => setSimState({...simState, amount: parseFloat(e.target.value) || 0})}
                                        />
                                    </div>
                                </div>

                                <div className="bg-[#0f172a] rounded-xl p-5 text-gray-300 font-mono text-xs md:text-sm shadow-inner border border-slate-700">
                                    <div className="text-emerald-400 font-semibold mb-3 pb-2 border-b border-slate-700 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> DOUBLE ENTRY GENERATED
                                    </div>
                                    
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center text-blue-300">
                                            <span>[DEBIT] {simResult.debitCoa} - {simResult.debitName}</span>
                                            <span className="font-semibold">{formatRp(simState.amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-rose-300 pl-4 md:pl-8">
                                            <span>[KREDIT] {simResult.creditCoa} - {simResult.creditName}</span>
                                            <span className="font-semibold">{formatRp(simState.amount)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-slate-400 mt-4 leading-relaxed font-sans text-xs">
                                        <strong>Logika: </strong>{simResult.notes}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'rekonsiliasi' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-teal-100 text-teal-700 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Rekonsiliasi Saldo Wadiah</h2>
                                    <p className="text-sm text-gray-500">Mencegah kebocoran dan selisih buku akuntansi</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600">
                                Fitur keamanan tertinggi dalam akuntansi Bank Santri. Digunakan untuk memastikan Total Saldo riil milik seluruh santri <strong>sama persis</strong> dengan Total Saldo Buku Besar (COA 2100).
                            </p>

                            <div className="bg-white border-2 border-teal-100 rounded-xl p-5 mt-4">
                                <h4 className="font-bold text-teal-800 mb-2">Jika Ditemukan Selisih:</h4>
                                <ul className="text-sm text-gray-600 space-y-2 pl-4 list-decimal">
                                    <li>Buka menu <b>Laporan &gt; Rekonsiliasi Saldo</b>.</li>
                                    <li>Sistem akan mendeteksi baris transaksi mana yang jurnal <i>ledger</i>-nya hilang atau terhapus.</li>
                                    <li>Klik tombol <b className="text-teal-700">Sync / Perbaiki Jurnal Otomatis</b>.</li>
                                    <li>Sistem akan merekonstruksi ulang pasangan jurnal sesuai riwayat <i>mutasi saldo</i> santri.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {activeSection === 'operasional' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-orange-100 text-orange-700 rounded-lg"><ArrowRightLeft className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Panduan Operasional Teller</h2>
                                    <p className="text-sm text-gray-500">Setor, Tarik, dan Limit Harian</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><PlusCircle className="w-4 h-4 text-green-600" /> Setor Tunai (Top-Up)</h4>
                                    <p className="text-sm text-gray-600 pl-6 border-l-2 border-gray-100">Dilakukan melalui menu <b>Top-Up / Setor Tunai</b>. Anda dapat mencari santri berdasarkan NIS atau Nama. Masukkan nominal fisik uang yang diterima. Jika uang ini bertujuan langsung melunasi Tagihan Syahriyah, <strong>wajib pilih Dropdown Paket Pembayaran</strong> pada saat top-up agar tagihan otomatis lunas.</p>
                                </div>
                                
                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4 text-rose-600" /> Tarik Tunai & Limit Harian</h4>
                                    <p className="text-sm text-gray-600 pl-6 border-l-2 border-gray-100">
                                        Penarikan tunai dijaga ketat oleh dua batasan:<br/>
                                        1. <b>Saldo Mengendap</b>: Batas uang minimal yang tidak bisa ditarik.<br/>
                                        2. <b>Limit Tarik Harian</b>: Mencegah santri menghabiskan uang secara masif dalam 1 hari. Jika limitnya Rp 20.000 dan ia sudah jajan di Koperasi Rp 15.000, maka di loket ia hanya bisa menarik Rp 5.000 hari itu.
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2 mb-2"><RefreshCcw className="w-4 h-4 text-purple-600" /> Reversal (Koreksi)</h4>
                                    <p className="text-sm text-gray-600 pl-6 border-l-2 border-gray-100">Jika kasir salah menginput nominal (misal 100.000 ditulis 1.000.000), <strong>jangan hapus transaksi dari database!</strong> Gunakan tombol <b>Reverse</b> pada detail transaksi. Sistem akan membuat Jurnal Balik secara otomatis agar jejak audit tetap terjaga 100%.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'tagihan' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-fuchsia-100 text-fuchsia-700 rounded-lg"><FileText className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Manajemen Tagihan & Uang Saku</h2>
                                    <p className="text-sm text-gray-500">Pemisahan cerdas antara biaya institusi dan hak santri</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">Dalam pesantren, Wali sering mengirimkan uang Rp 1.000.000 per bulan secara utuh (Gelondongan). Padahal di dalamnya ada hak Pesantren (SPP, Makan) dan hak Santri (Uang Jajan). Fitur Paket Pembayaran memisahkan ini secara otomatis.</p>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Isi Paket Tagihan</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Logika Sistem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr className="bg-white">
                                            <td className="px-4 py-3">Uang Makan Dapur</td>
                                            <td className="px-4 py-3"><span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold">BUKAN SAKU</span></td>
                                            <td className="px-4 py-3 text-gray-600">Diproses memotong saldo tabungan, lalu dijurnalkan masuk ke Pendapatan Pesantren (COA 4).</td>
                                        </tr>
                                        <tr className="bg-white">
                                            <td className="px-4 py-3">Uang Jajan / Saku</td>
                                            <td className="px-4 py-3"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">UANG SAKU</span></td>
                                            <td className="px-4 py-3 text-gray-600"><strong>TIDAK DIPOTONG</strong>. Dana dibiarkan tertinggal di saldo rekening Santri agar bisa dijajankan via RFID Koperasi.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeSection === 'koperasi' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className="p-2.5 bg-yellow-100 text-yellow-700 rounded-lg"><Store className="w-5 h-5" /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Integrasi Eksternal (Kasir Koperasi)</h2>
                                    <p className="text-sm text-gray-500">Menghubungkan API Bank dengan Kantin / Koperasi</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600">
                                Mesin POS Kasir di Koperasi tidak memerlukan login akun Teller. Sistem menggunakan <b>API Key (X-Koperasi-Key)</b> untuk menjembatani komunikasi.
                            </p>

                            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-3 mt-4">
                                <li><strong>Pendaftaran Outlet:</strong> Admin Bank masuk ke menu <b>Master Data &gt; Merchant Koperasi</b>. Tambahkan outlet (misal: "Kantin Putra"). Salin <i>Secret Key</i> yang diberikan.</li>
                                <li><strong>Implementasi di Kasir:</strong> Petugas kantin memasukkan Secret Key ke aplikasinya.</li>
                                <li><strong>Sistem Real-Time:</strong> Saat santri men-tap ID Card (RFID), Kasir Kantin akan mengirim request Debit. Bank Santri secara langsung akan:
                                    <ul className="list-disc pl-5 mt-1 text-gray-500">
                                        <li>Memeriksa status aktif rekening.</li>
                                        <li>Mengecek Saldo Minimum.</li>
                                        <li>Mengecek sisa Limit Harian belanja.</li>
                                        <li>Mengurangi saldo tabungan.</li>
                                    </ul>
                                </li>
                            </ol>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PanduanPage;
