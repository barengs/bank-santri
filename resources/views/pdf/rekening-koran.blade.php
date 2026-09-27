<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Rekening Koran - {{ $account->account_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 8.5px; color: #1e293b; padding: 22px; }

        .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 12px; }
        .header table { width: 100%; border-collapse: collapse; }
        .header .bank-title { font-size: 16px; font-weight: bold; color: #1e3a8a; }
        .header .bank-sub { font-size: 8.5px; color: #64748b; margin-top: 2px; }
        .header .doc-title { font-size: 13px; font-weight: bold; color: #0f172a; text-align: right; text-transform: uppercase; }
        .header .doc-period { font-size: 8.5px; color: #475569; text-align: right; margin-top: 2px; }

        .info-card { width: 100%; border-collapse: collapse; margin-bottom: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; }
        .info-card td { padding: 6px 10px; font-size: 8.5px; vertical-align: top; }
        .info-card td.lbl { width: 16%; color: #64748b; font-weight: 500; }
        .info-card td.val { width: 34%; color: #0f172a; font-weight: bold; }

        table.movements { width: 100%; border-collapse: collapse; margin-top: 8px; }
        table.movements th { background: #1e3a8a; color: #ffffff; padding: 6px 5px; font-size: 8px; text-transform: uppercase; font-weight: bold; text-align: left; }
        table.movements td { padding: 5px; border-bottom: 1px solid #e2e8f0; font-size: 8px; }
        table.movements tr:nth-child(even) { background: #f8fafc; }

        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: 'Courier New', Courier, monospace; }
        .debit { color: #dc2626; }
        .credit { color: #16a34a; }

        .summary-box { width: 100%; border-collapse: collapse; margin-top: 14px; margin-bottom: 18px; }
        .summary-box td { padding: 6px 10px; font-size: 8.5px; border: 1px solid #cbd5e1; }
        .summary-box th { background: #f1f5f9; padding: 6px 10px; font-size: 8.5px; text-align: left; border: 1px solid #cbd5e1; font-weight: bold; }

        .signatures { width: 100%; margin-top: 25px; border-collapse: collapse; }
        .signatures td { width: 50%; text-align: center; font-size: 8.5px; vertical-align: top; }
        .sig-line { margin-top: 45px; font-weight: bold; text-decoration: underline; }

        .footer { position: fixed; bottom: 10px; left: 22px; right: 22px; font-size: 7.5px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td style="width:60%">
                    <div class="bank-title">BANK SANTRI</div>
                    <div class="bank-sub">Sistem Perbankan &amp; Layanan Keuangan Santri Pesantren</div>
                </td>
                <td style="width:40%">
                    <div class="doc-title">REKENING KORAN</div>
                    <div class="doc-period">
                        @if(!empty($filters['month']) && !empty($filters['year']))
                            Periode: Bulan {{ DateTime::createFromFormat('!m', $filters['month'])->format('F') }} {{ $filters['year'] }}
                        @elseif(!empty($filters['start_date']) && !empty($filters['end_date']))
                            Periode: {{ date('d/m/Y', strtotime($filters['start_date'])) }} s/d {{ date('d/m/Y', strtotime($filters['end_date'])) }}
                        @else
                            Periode: Seluruh Mutasi
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <table class="info-card">
        <tr>
            <td class="lbl">No. Rekening / NIS</td>
            <td class="val font-mono">{{ $account->account_number }}</td>
            <td class="lbl">Produk Tabungan</td>
            <td class="val">{{ $account->product?->product_name ?? 'Tabungan Santri' }}</td>
        </tr>
        <tr>
            <td class="lbl">Nama Nasabah</td>
            <td class="val">{{ $account->customer_name }}</td>
            <td class="lbl">Akad Syariah</td>
            <td class="val" style="text-transform: capitalize;">{{ $account->product?->akad_type ?? $account->akad_type ?? 'Wadiah' }}</td>
        </tr>
        <tr>
            <td class="lbl">Status Rekening</td>
            <td class="val">{{ $account->status ?? 'AKTIF' }}</td>
            <td class="lbl">Tanggal Cetak</td>
            <td class="val">{{ $generated_at }}</td>
        </tr>
    </table>

    <table class="movements">
        <thead>
            <tr>
                <th style="width: 4%" class="text-center">No</th>
                <th style="width: 14%">Waktu</th>
                <th style="width: 14%">No. Referensi</th>
                <th style="width: 32%">Keterangan</th>
                <th style="width: 12%" class="text-right">Debit (Keluar)</th>
                <th style="width: 12%" class="text-right">Kredit (Masuk)</th>
                <th style="width: 12%" class="text-right">Saldo</th>
            </tr>
        </thead>
        <tbody>
            {{-- Baris Saldo Awal --}}
            <tr style="background: #eef2ff; font-weight: bold;">
                <td class="text-center">-</td>
                <td colspan="3">SALDO AWAL</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right font-mono">Rp {{ number_format($openingBalance, 0, ',', '.') }}</td>
            </tr>

            @php
                $runningBalance = $openingBalance;
                $totalDebit = 0;
                $totalCredit = 0;
            @endphp

            @forelse($movements as $idx => $m)
                @php
                    $isCredit = ($m->type === 'credit');
                    $debitAmount = $isCredit ? 0 : $m->amount;
                    $creditAmount = $isCredit ? $m->amount : 0;

                    $totalDebit += $debitAmount;
                    $totalCredit += $creditAmount;
                    $runningBalance = $m->balance_after ?? ($runningBalance + $creditAmount - $debitAmount);
                @endphp
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td>{{ $m->created_at?->format('d/m/Y H:i') }}</td>
                    <td class="font-mono">{{ $m->reference_number ?? ($m->transaction?->reference_number ?? '-') }}</td>
                    <td>{{ $m->description ?? '-' }}</td>
                    <td class="text-right debit font-mono">
                        {{ $debitAmount > 0 ? 'Rp ' . number_format($debitAmount, 0, ',', '.') : '-' }}
                    </td>
                    <td class="text-right credit font-mono">
                        {{ $creditAmount > 0 ? 'Rp ' . number_format($creditAmount, 0, ',', '.') : '-' }}
                    </td>
                    <td class="text-right font-mono" style="font-weight: 500;">
                        Rp {{ number_format($runningBalance, 0, ',', '.') }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 16px; color: #94a3b8;">
                        Tidak ada catatan transaksi pada rentang waktu yang dipilih.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- Ringkasan Mutasi --}}
    <table class="summary-box">
        <tr>
            <th style="width: 25%;">Saldo Awal</th>
            <th style="width: 25%;">Total Kredit (Masuk)</th>
            <th style="width: 25%;">Total Debit (Keluar)</th>
            <th style="width: 25%;">Saldo Akhir</th>
        </tr>
        <tr>
            <td class="font-mono" style="font-weight: bold;">Rp {{ number_format($openingBalance, 0, ',', '.') }}</td>
            <td class="font-mono credit" style="font-weight: bold;">Rp {{ number_format($totalCredit, 0, ',', '.') }}</td>
            <td class="font-mono debit" style="font-weight: bold;">Rp {{ number_format($totalDebit, 0, ',', '.') }}</td>
            <td class="font-mono" style="font-weight: bold; background: #f0fdf4; color: #166534;">
                Rp {{ number_format($runningBalance, 0, ',', '.') }}
            </td>
        </tr>
    </table>

    {{-- Tanda Tangan Pengesahan --}}
    <table class="signatures">
        <tr>
            <td>
                <div>Mengetahui,</div>
                <div style="font-weight: bold; margin-top: 2px;">Customer Service / Teller</div>
                <div class="sig-line">Petugas Bank Santri</div>
            </td>
            <td>
                <div>Pemegang Rekening,</div>
                <div style="font-weight: bold; margin-top: 2px;">Santri / Wali Santri</div>
                <div class="sig-line">{{ $account->customer_name }}</div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Dokumen resmi Rekening Koran yang dicetak oleh Sistem Perbankan Bank Santri &copy; {{ date('Y') }}. Informasi saldo dan mutasi sah sesuai pembukuan bank.
    </div>
</body>
</html>
