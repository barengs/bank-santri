<?php

namespace App\Exports;

use App\Models\Transaction;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class TransactionExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = is_array($filters)
            ? $filters
            : $filters->only(['account_number', 'status', 'channel', 'date_from', 'date_to', 'search']);
    }

    public function collection()
    {
        return Transaction::with(['sourceAccount:account_number,customer_name', 'destinationAccount:account_number,customer_name', 'transactionType:id,name,code'])
            ->when(!empty($this->filters['account_number']), function ($q) {
                $an = $this->filters['account_number'];
                $q->where(function ($query) use ($an) {
                    $query->where('source_account', $an)->orWhere('destination_account', $an);
                });
            })
            ->when(!empty($this->filters['status']), fn($q) => $q->where('status', $this->filters['status']))
            ->when(!empty($this->filters['channel']), fn($q) => $q->where('channel', $this->filters['channel']))
            ->when(!empty($this->filters['date_from']), fn($q) => $q->whereDate('created_at', '>=', $this->filters['date_from']))
            ->when(!empty($this->filters['date_to']), fn($q) => $q->whereDate('created_at', '<=', $this->filters['date_to']))
            ->when(!empty($this->filters['search']), function ($q) {
                $s = $this->filters['search'];
                $q->where(function ($query) use ($s) {
                    $query->where('reference_number', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'No. Referensi',
            'Tanggal',
            'Jenis Transaksi',
            'Sumber (Rek. Asal)',
            'Nama Sumber',
            'Tujuan (Rek. Tujuan)',
            'Nama Tujuan',
            'Jumlah',
            'Channel',
            'Status',
            'Keterangan',
        ];
    }

    public function map($trx): array
    {
        return [
            $trx->reference_number ?? '-',
            $trx->created_at?->format('Y-m-d H:i:s') ?? '-',
            $trx->transactionType?->name ?? '-',
            $trx->source_account ?? '-',
            $trx->sourceAccount?->customer_name ?? '-',
            $trx->destination_account ?? '-',
            $trx->destinationAccount?->customer_name ?? '-',
            $trx->amount,
            $trx->channel ?? '-',
            $trx->status ?? '-',
            $trx->description ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Daftar Transaksi';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
