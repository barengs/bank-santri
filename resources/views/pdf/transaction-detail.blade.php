<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Bukti Transaksi - {{ $transaction->reference_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 8px; color: #111; padding: 10px; width: 100%; }

        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #444; margin: 6px 0; }
        .double-divider { border-top: 2px dashed #111; margin: 8px 0; }

        .header h1 { font-size: 11px; margin-bottom: 2px; }
        .header p { font-size: 7px; color: #444; }

        table { width: 100%; border-collapse: collapse; margin: 4px 0; }
        table td { padding: 2px 0; vertical-align: top; font-size: 8px; }
        table td.label { width: 40%; color: #444; }
        table td.val { width: 60%; text-align: right; }

        .amount-box { text-align: center; margin: 8px 0; padding: 6px; border: 1px solid #111; }
        .amount-box .label { font-size: 8px; color: #555; }
        .amount-box .value { font-size: 13px; font-weight: bold; margin-top: 2px; }

        .status-badge { text-align: center; margin: 4px 0; font-size: 8px; font-weight: bold; }
        .status-success { color: #15803d; }
        .status-pending { color: #a16207; }
        .status-failed  { color: #b91c1c; }

        .footer { text-align: center; margin-top: 8px; font-size: 7px; color: #555; }
    </style>
</head>
<body>
    <div class="header center">
        <h1 class="bold">BANK SANTRI</h1>
        <p>Sistem Keuangan & Perbankan Santri</p>
        <p>Struk Bukti Transaksi</p>
    </div>

    <div class="divider"></div>

    <table>
        <tr>
            <td class="label">No. Ref</td>
            <td class="val bold">{{ $transaction->reference_number }}</td>
        </tr>
        <tr>
            <td class="label">Tanggal</td>
            <td class="val">{{ $transaction->created_at?->format('d/m/Y H:i:s') }}</td>
        </tr>
        <tr>
            <td class="label">Jenis</td>
            <td class="val bold">{{ $transaction->transactionType?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Channel</td>
            <td class="val">{{ ucfirst($transaction->channel ?? 'Teller') }}</td>
        </tr>
    </table>

    <div class="divider"></div>

    <table>
        @if($transaction->source_account)
        <tr>
            <td class="label">Rek. Asal</td>
            <td class="val">{{ $transaction->source_account }}</td>
        </tr>
        @if($transaction->sourceAccount)
        <tr>
            <td class="label">Nama</td>
            <td class="val bold">{{ $transaction->sourceAccount->customer_name }}</td>
        </tr>
        @endif
        @endif

        @if($transaction->destination_account)
        <tr>
            <td class="label">Rek. Tujuan</td>
            <td class="val">{{ $transaction->destination_account }}</td>
        </tr>
        @if($transaction->destinationAccount)
        <tr>
            <td class="label">Nama</td>
            <td class="val bold">{{ $transaction->destinationAccount->customer_name }}</td>
        </tr>
        @endif
        @endif
    </table>

    <div class="amount-box">
        <div class="label">NOMINAL</div>
        <div class="value">Rp {{ number_format($transaction->amount, 0, ',', '.') }}</div>
    </div>

    @if($transaction->description)
    <table>
        <tr>
            <td class="label">Keterangan</td>
            <td class="val">{{ $transaction->description }}</td>
        </tr>
    </table>
    @endif

    <div class="status-badge status-{{ $transaction->status }}">
        STATUS: {{ strtoupper($transaction->status) }}
    </div>

    <div class="double-divider"></div>

    <div class="footer">
        <p>Simpan struk ini sebagai bukti transaksi sah.</p>
        <p>Terima kasih atas kepercayaan Anda.</p>
        <p style="margin-top: 4px;">{{ $generated_at }}</p>
    </div>
</body>
</html>
