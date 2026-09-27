<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Daftar Transaksi Bank Santri</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 9px; color: #333; padding: 20px; }

        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .header h1 { font-size: 16px; color: #1e40af; margin-bottom: 2px; }
        .header h2 { font-size: 12px; color: #3b82f6; margin-bottom: 4px; }
        .header .subtitle { font-size: 9px; color: #666; }

        .filters { background: #f0f4ff; padding: 6px 10px; border-radius: 4px; margin-bottom: 10px; font-size: 8px; }
        .filters strong { color: #1e40af; }

        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        table th { background: #2563eb; color: #fff; padding: 5px 4px; text-align: left; font-size: 8px; text-transform: uppercase; }
        table td { padding: 4px; border-bottom: 1px solid #e5e7eb; font-size: 8px; }
        table tr:nth-child(even) { background: #f9fafb; }
        table tr:hover { background: #eff6ff; }

        .amount { text-align: right; font-family: 'DejaVu Sans', monospace; }
        .status { padding: 1px 5px; border-radius: 3px; font-size: 7px; font-weight: bold; text-transform: uppercase; }
        .status-success { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef9c3; color: #854d0e; }
        .status-failed  { background: #fee2e2; color: #991b1b; }
        .status-reversed { background: #f3e8ff; color: #6b21a8; }

        .footer { margin-top: 15px; font-size: 7px; color: #999; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 5px; }
        .total-row { font-weight: bold; background: #eff6ff !important; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>BANK SANTRI</h1>
        <h2>Laporan Daftar Transaksi</h2>
        <div class="subtitle">Dicetak pada: {{ $generated_at }}</div>
    </div>

    @if(!empty(array_filter($filters)))
    <div class="filters">
        <strong>Filter:</strong>
        @if(!empty($filters['account_number'])) No. Rekening: {{ $filters['account_number'] }} | @endif
        @if(!empty($filters['status'])) Status: {{ ucfirst($filters['status']) }} | @endif
        @if(!empty($filters['channel'])) Channel: {{ ucfirst($filters['channel']) }} | @endif
        @if(!empty($filters['date_from'])) Dari: {{ $filters['date_from'] }} | @endif
        @if(!empty($filters['date_to'])) Sampai: {{ $filters['date_to'] }} | @endif
        @if(!empty($filters['search'])) Pencarian: "{{ $filters['search'] }}" @endif
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th style="width:3%">No</th>
                <th style="width:12%">Referensi</th>
                <th style="width:8%">Tanggal</th>
                <th style="width:10%">Jenis</th>
                <th style="width:14%">Sumber</th>
                <th style="width:14%">Tujuan</th>
                <th style="width:12%">Jumlah</th>
                <th style="width:7%">Channel</th>
                <th style="width:7%">Status</th>
                <th style="width:13%">Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @php $totalAmount = 0; @endphp
            @forelse($transactions as $i => $trx)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $trx->reference_number }}</td>
                <td>{{ $trx->created_at?->format('d/m/Y H:i') }}</td>
                <td>{{ $trx->transaction_type_name ?? '-' }}</td>
                <td>
                    {{ $trx->source_account ?? '-' }}<br>
                    <small style="color:#666">{{ $trx->source_account_name ?? '' }}</small>
                </td>
                <td>
                    {{ $trx->destination_account ?? '-' }}<br>
                    <small style="color:#666">{{ $trx->destination_account_name ?? '' }}</small>
                </td>
                <td class="amount">Rp {{ number_format($trx->amount, 0, ',', '.') }}</td>
                <td>{{ ucfirst($trx->channel ?? '-') }}</td>
                <td>
                    <span class="status status-{{ $trx->status }}">{{ $trx->status }}</span>
                </td>
                <td>{{ \Illuminate\Support\Str::limit($trx->description, 40) }}</td>
            </tr>
            @php
                if ($trx->status === 'success') {
                    $totalAmount += $trx->amount;
                }
            @endphp
            @empty
            <tr>
                <td colspan="10" style="text-align:center; padding: 20px; color:#999;">Tidak ada data transaksi.</td>
            </tr>
            @endforelse

            @if($transactions->count() > 0)
            <tr class="total-row">
                <td colspan="6" style="text-align:right; font-weight:bold;">Total (Success):</td>
                <td class="amount" style="font-weight:bold;">Rp {{ number_format($totalAmount, 0, ',', '.') }}</td>
                <td colspan="3"></td>
            </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        Total: {{ $transactions->count() }} transaksi &middot; Bank Santri &copy; {{ date('Y') }}
    </div>
</body>
</html>
