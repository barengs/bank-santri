<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Rekapitulasi Produk Bank</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 8.5px; color: #1e293b; padding: 22px; line-height: 1.3; }

        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
        .header h1 { font-size: 15px; color: #1e3a8a; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 2px; }
        .header h2 { font-size: 11px; color: #2563eb; font-weight: bold; margin-bottom: 3px; }
        .header .subtitle { font-size: 8px; color: #64748b; }

        .info-bar { width: 100%; margin-bottom: 12px; font-size: 8px; }
        .info-bar td { padding: 3px 0; }
        .info-lbl { width: 15%; color: #64748b; font-weight: bold; }
        .info-val { width: 35%; color: #0f172a; }

        /* Summary Cards Box */
        .summary-box { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .summary-box th { background: #f1f5f9; color: #334155; padding: 5px 6px; font-size: 7.5px; text-transform: uppercase; border: 1px solid #cbd5e1; text-align: center; }
        .summary-box td { padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 8.5px; font-weight: bold; }
        .val-masuk { color: #16a34a; }
        .val-keluar { color: #dc2626; }
        .val-saldo { color: #1e40af; background: #eff6ff; }

        .section-title { font-size: 9.5px; font-weight: bold; color: #1e3a8a; margin: 12px 0 5px 0; border-left: 3px solid #2563eb; padding-left: 6px; }

        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.data-table th { background: #1e3a8a; color: #ffffff; padding: 5px 4px; text-align: left; font-size: 7.5px; text-transform: uppercase; border: 1px solid #1e3a8a; }
        table.data-table td { padding: 4px; border: 1px solid #e2e8f0; font-size: 7.5px; }
        table.data-table tr:nth-child(even) { background: #f8fafc; }
        table.data-table tr.total-row { background: #e2e8f0; font-weight: bold; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: 'DejaVu Sans', monospace; }

        .badge { display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 6.5px; font-weight: bold; text-transform: uppercase; }
        .badge-masuk { background: #dcfce7; color: #166534; }
        .badge-keluar { background: #fee2e2; color: #991b1b; }

        /* Signatures Section */
        .signatures { width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid; }
        .signatures td { width: 50%; text-align: center; vertical-align: top; padding: 0 20px; font-size: 8px; }
        .sig-role { font-weight: bold; color: #0f172a; margin-top: 2px; }
        .sig-space { height: 48px; }
        .sig-name { font-weight: bold; text-decoration: underline; color: #0f172a; }
        .sig-nip { font-size: 7.5px; color: #64748b; margin-top: 1px; }

        .footer { margin-top: 20px; font-size: 7px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>
    {{-- Header --}}
    <div class="header">
        <h1>BANK SANTRI PESANTREN</h1>
        <h2>Laporan Rekapitulasi Produk Bank & Rincian Transaksi</h2>
        <div class="subtitle">Sistem Informasi Perbankan & Manajemen Saldo Nasabah Pesantren</div>
    </div>

    {{-- Filter Metadata --}}
    <table class="info-bar">
        <tr>
            <td class="info-lbl">Periode Laporan</td>
            <td class="info-val">: {{ \Carbon\Carbon::parse($startDate)->translatedFormat('d F Y') }} s/d {{ \Carbon\Carbon::parse($endDate)->translatedFormat('d F Y') }}</td>
            <td class="info-lbl">Waktu Cetak</td>
            <td class="info-val">: {{ $generated_at }}</td>
        </tr>
        <tr>
            <td class="info-lbl">Filter Produk</td>
            <td class="info-val">: {{ $selectedProduct ? $selectedProduct->product_name . ' (' . $selectedProduct->product_code . ')' : 'Semua Produk Bank' }}</td>
            <td class="info-lbl">Rincian Transaksi</td>
            <td class="info-val">: {{ !empty($selectedTransactionItem) ? $selectedTransactionItem->item_name : 'Semua Rincian Transaksi' }}</td>
        </tr>
        <tr>
            <td class="info-lbl">Arus Transaksi</td>
            <td class="info-val">: {{ ($category ?? 'all') === 'credit' ? 'Dana Masuk (Kredit)' : (($category ?? 'all') === 'debit' ? 'Dana Keluar (Debit)' : 'Semua Arus Transaksi') }}</td>
            <td class="info-lbl">Total Rekening</td>
            <td class="info-val">: {{ number_format($summary['total_accounts'], 0, ',', '.') }} Rekening Aktif</td>
        </tr>
    </table>

    {{-- Kotak Ringkasan Eksekutif --}}
    <table class="summary-box">
        <thead>
            <tr>
                <th style="width: 25%;">Total Saldo Simpanan</th>
                <th style="width: 25%;">Total Dana Masuk (Kredit)</th>
                <th style="width: 25%;">Total Dana Keluar (Debit)</th>
                <th style="width: 25%;">Perubahan Bersih (Net)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="val-saldo font-mono">Rp {{ number_format($summary['total_balance'], 0, ',', '.') }}</td>
                <td class="val-masuk font-mono">Rp {{ number_format($summary['total_masuk'], 0, ',', '.') }}</td>
                <td class="val-keluar font-mono">Rp {{ number_format($summary['total_keluar'], 0, ',', '.') }}</td>
                <td class="font-mono" style="color: {{ $summary['net_change'] >= 0 ? '#16a34a' : '#dc2626' }};">
                    {{ $summary['net_change'] >= 0 ? '+' : '' }}Rp {{ number_format($summary['net_change'], 0, ',', '.') }}
                </td>
            </tr>
        </tbody>
    </table>

    {{-- 1. Rekapitulasi per Produk Bank --}}
    <div class="section-title">I. REKAPITULASI DANA PER PRODUK BANK</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 4%;" class="text-center">No</th>
                <th style="width: 12%;">Kode</th>
                <th style="width: 26%;">Nama Produk Bank</th>
                <th style="width: 10%;" class="text-center">Jumlah Rekening</th>
                <th style="width: 16%;" class="text-right">Dana Masuk</th>
                <th style="width: 16%;" class="text-right">Dana Keluar</th>
                <th style="width: 16%;" class="text-right">Saldo Saat Ini</th>
            </tr>
        </thead>
        <tbody>
            @forelse($products as $idx => $p)
            <tr>
                <td class="text-center">{{ $idx + 1 }}</td>
                <td class="font-mono"><strong>{{ $p->product_code }}</strong></td>
                <td>{{ $p->product_name }}</td>
                <td class="text-center font-mono">{{ number_format($p->total_accounts, 0, ',', '.') }}</td>
                <td class="text-right font-mono val-masuk">Rp {{ number_format($p->total_credit, 0, ',', '.') }}</td>
                <td class="text-right font-mono val-keluar">Rp {{ number_format($p->total_debit, 0, ',', '.') }}</td>
                <td class="text-right font-mono" style="font-weight: bold;">Rp {{ number_format($p->total_balance, 0, ',', '.') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="text-center" style="padding: 10px; color: #94a3b8;">Tidak ada data produk bank yang sesuai.</td>
            </tr>
            @endforelse
            @if(count($products) > 0)
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">TOTAL:</td>
                <td class="text-center font-mono">{{ number_format($summary['total_accounts'], 0, ',', '.') }}</td>
                <td class="text-right font-mono val-masuk">Rp {{ number_format($summary['total_masuk'], 0, ',', '.') }}</td>
                <td class="text-right font-mono val-keluar">Rp {{ number_format($summary['total_keluar'], 0, ',', '.') }}</td>
                <td class="text-right font-mono">Rp {{ number_format($summary['total_balance'], 0, ',', '.') }}</td>
            </tr>
            @endif
        </tbody>
    </table>

    {{-- 2. Rincian Mutasi / Transaksi --}}
    <div class="section-title">II. RINCIAN TRANSAKSI & MUTASI (PERIODE TERKAIT)</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 3%;" class="text-center">No</th>
                <th style="width: 13%;">Waktu</th>
                <th style="width: 13%;">No. Referensi</th>
                <th style="width: 18%;">Rekening / Santri</th>
                <th style="width: 14%;">Produk</th>
                <th style="width: 8%;" class="text-center">Arus</th>
                <th style="width: 14%;" class="text-right">Nominal</th>
                <th style="width: 17%;">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $i => $trx)
            <tr>
                <td class="text-center">{{ $i + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($trx->created_at)->format('d/m/Y H:i') }}</td>
                <td class="font-mono" style="color: #2563eb;">{{ $trx->reference_number ?? '-' }}</td>
                <td>
                    <strong>{{ $trx->customer_name }}</strong><br>
                    <span class="font-mono" style="color: #64748b;">{{ $trx->account_number }}</span>
                </td>
                <td>{{ $trx->product_name }}</td>
                <td class="text-center">
                    @if($trx->type === 'credit')
                        <span class="badge badge-masuk">MASUK</span>
                    @else
                        <span class="badge badge-keluar">KELUAR</span>
                    @endif
                </td>
                <td class="text-right font-mono" style="font-weight: bold; color: {{ $trx->type === 'credit' ? '#16a34a' : '#dc2626' }};">
                    {{ $trx->type === 'credit' ? '+' : '-' }}Rp {{ number_format($trx->amount, 0, ',', '.') }}
                </td>
                <td>{{ \Illuminate\Support\Str::limit($trx->description, 35) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="text-center" style="padding: 10px; color: #94a3b8;">Tidak ada transaksi pada periode yang dipilih.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    @if(count($transactions) >= 300)
    <div style="font-size: 7px; color: #64748b; font-style: italic; margin-bottom: 8px;">
        * Menampilkan 300 transaksi terbaru pada periode ini. Untuk melihat seluruh data transaksi, gunakan filter rentang tanggal yang lebih spesifik.
    </div>
    @endif

    {{-- Kolom Tanda Tangan Pejabat Bank --}}
    <table class="signatures">
        <tr>
            <td>
                <div>Mengetahui & Menyetujui,</div>
                <div class="sig-role">Pimpinan / Direktur Bank Santri</div>
                <div class="sig-space"></div>
                <div class="sig-name">( __________________________ )</div>
                <div class="sig-nip">NIP / ID: .....................................</div>
            </td>
            <td>
                <div>Dibuat & Diverifikasi,</div>
                <div class="sig-role">Admin Keuangan / Teller Operasional</div>
                <div class="sig-space"></div>
                <div class="sig-name">( __________________________ )</div>
                <div class="sig-nip">NIP / ID: .....................................</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen Laporan Rekapitulasi Resmi &middot; Bank Santri Pesantren &copy; {{ date('Y') }} &middot; Dicetak otomatis oleh sistem.
    </div>
</body>
</html>
