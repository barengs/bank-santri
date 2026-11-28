<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Saldo Terkini Semua Rekening</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 8px; color: #1e293b; padding: 20px; line-height: 1.3; }

        .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
        .header h1 { font-size: 14px; color: #1e3a8a; font-weight: bold; letter-spacing: 0.5px; margin-bottom: 2px; }
        .header h2 { font-size: 10.5px; color: #2563eb; font-weight: bold; margin-bottom: 2px; }
        .header .subtitle { font-size: 7.5px; color: #64748b; }

        .info-bar { width: 100%; margin-bottom: 10px; font-size: 7.5px; }
        .info-bar td { padding: 2px 0; }
        .info-lbl { width: 16%; color: #64748b; font-weight: bold; }
        .info-val { width: 34%; color: #0f172a; }

        .summary-box { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .summary-box th { background: #f1f5f9; color: #334155; padding: 5px; font-size: 7px; text-transform: uppercase; border: 1px solid #cbd5e1; text-align: center; }
        .summary-box td { padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-size: 8.5px; font-weight: bold; }
        .val-saldo { color: #1e40af; background: #eff6ff; }

        table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        table.data-table th { background: #1e3a8a; color: #ffffff; padding: 5px 4px; text-align: left; font-size: 7px; text-transform: uppercase; border: 1px solid #1e3a8a; }
        table.data-table td { padding: 4px; border: 1px solid #e2e8f0; font-size: 7.5px; vertical-align: middle; }
        table.data-table tr:nth-child(even) { background: #f8fafc; }
        table.data-table tr.total-row { background: #e2e8f0; font-weight: bold; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: 'DejaVu Sans', monospace; }

        .badge { display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 6.5px; font-weight: bold; text-transform: uppercase; }
        .badge-santri { background: #dbeafe; color: #1e40af; }
        .badge-instansi { background: #ede9fe; color: #5b21b6; }
        .badge-aktif { background: #dcfce7; color: #166534; }
        .badge-nonaktif { background: #fee2e2; color: #991b1b; }

        .signatures { width: 100%; margin-top: 22px; border-collapse: collapse; page-break-inside: avoid; }
        .signatures td { width: 50%; text-align: center; vertical-align: top; padding: 0 20px; font-size: 8px; }
        .sig-role { font-weight: bold; color: #0f172a; margin-top: 2px; }
        .sig-space { height: 45px; }
        .sig-name { font-weight: bold; text-decoration: underline; color: #0f172a; }

        .footer { margin-top: 14px; font-size: 7px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BANK SANTRI PESANTREN</h1>
        <h2>Laporan Saldo Terkini Semua Rekening</h2>
        <div class="subtitle">Dokumen Acuan Mitigasi &amp; Rekonsiliasi Saldo Nasabah</div>
    </div>

    <table class="info-bar">
        <tr>
            <td class="info-lbl">Waktu Cetak</td>
            <td class="info-val">: {{ $generated_at }}</td>
            <td class="info-lbl">Filter Produk</td>
            <td class="info-val">: {{ $selectedProduct ? $selectedProduct->product_name : 'Semua Produk Bank' }}</td>
        </tr>
        <tr>
            <td class="info-lbl">Jenis Rekening</td>
            <td class="info-val">: {{ $accountType === 'santri' ? 'Rekening Santri' : ($accountType === 'instansi' ? 'Rekening Instansi' : 'Semua Rekening') }}</td>
            <td class="info-lbl">Status Rekening</td>
            <td class="info-val">: {{ $status ?: 'Semua Status' }}</td>
        </tr>
    </table>

    <table class="summary-box">
        <thead>
            <tr>
                <th style="width: 25%;">Total Rekening</th>
                <th style="width: 25%;">Total Saldo Keseluruhan</th>
                <th style="width: 25%;">Total Saldo Santri ({{ number_format($summary['santri_count'], 0, ',', '.') }})</th>
                <th style="width: 25%;">Total Saldo Instansi ({{ number_format($summary['instansi_count'], 0, ',', '.') }})</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ number_format($summary['total_accounts'], 0, ',', '.') }} Rekening</td>
                <td class="val-saldo font-mono">Rp {{ number_format($summary['total_balance'], 0, ',', '.') }}</td>
                <td class="font-mono">Rp {{ number_format($summary['santri_balance'], 0, ',', '.') }}</td>
                <td class="font-mono">Rp {{ number_format($summary['instansi_balance'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 4%;" class="text-center">No</th>
                <th style="width: 14%;">No. Rekening / NIS</th>
                <th style="width: 24%;">Nama Pemilik Rekening</th>
                <th style="width: 8%;" class="text-center">Jenis</th>
                <th style="width: 15%;">Produk Bank</th>
                <th style="width: 8%;" class="text-center">Status</th>
                <th style="width: 13%;" class="text-right">Saldo Terkini</th>
                <th style="width: 14%;" class="text-center">Tgl Transaksi Terakhir</th>
            </tr>
        </thead>
        <tbody>
            @forelse($accounts as $idx => $acc)
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td class="font-mono">{{ $acc->account_number }}</td>
                    <td>{{ $acc->customer_name ?? '-' }}</td>
                    <td class="text-center">
                        @if((int) $acc->customer_id === 0)
                            <span class="badge badge-instansi">Instansi</span>
                        @else
                            <span class="badge badge-santri">Santri</span>
                        @endif
                    </td>
                    <td>{{ $acc->product->product_name ?? '-' }}</td>
                    <td class="text-center">
                        <span class="badge {{ $acc->status === 'AKTIF' ? 'badge-aktif' : 'badge-nonaktif' }}">
                            {{ $acc->status ?? '-' }}
                        </span>
                    </td>
                    <td class="text-right font-mono">Rp {{ number_format($acc->balance, 0, ',', '.') }}</td>
                    <td class="text-center font-mono">
                        {{ $acc->last_transaction_at ? \Carbon\Carbon::parse($acc->last_transaction_at)->format('d/m/Y H:i') : '-' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" class="text-center">Tidak ada data rekening.</td>
                </tr>
            @endforelse
            @if($accounts->count() > 0)
                <tr class="total-row">
                    <td colspan="6" class="text-right">TOTAL SALDO KESELURUHAN</td>
                    <td class="text-right font-mono">Rp {{ number_format($summary['total_balance'], 0, ',', '.') }}</td>
                    <td></td>
                </tr>
            @endif
        </tbody>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div>Mengetahui,</div>
                <div class="sig-role">Pimpinan / Kepala Bank Santri</div>
                <div class="sig-space"></div>
                <div class="sig-name">( ........................................ )</div>
            </td>
            <td>
                <div>Dicetak Oleh,</div>
                <div class="sig-role">Petugas / Admin Bank Santri</div>
                <div class="sig-space"></div>
                <div class="sig-name">( {{ $printed_by ?? 'Admin Bank' }} )</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen ini dicetak secara otomatis oleh Sistem Bank Santri pada {{ $generated_at }} sebagai acuan mitigasi saldo rekening.
    </div>
</body>
</html>
