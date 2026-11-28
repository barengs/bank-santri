<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AccountBalanceExport implements FromCollection, WithHeadings, WithMapping, WithTitle, WithStyles, ShouldAutoSize
{
    protected Collection $accounts;
    protected int $rowNumber = 0;

    public function __construct(Collection $accounts)
    {
        $this->accounts = $accounts;
    }

    public function collection(): Collection
    {
        return $this->accounts;
    }

    public function headings(): array
    {
        return [
            'No',
            'No. Rekening / NIS',
            'Nama Pemilik Rekening',
            'Jenis Rekening',
            'Produk Bank',
            'Status',
            'Saldo Terkini (Rp)',
            'Tanggal Transaksi Terakhir',
        ];
    }

    public function map($account): array
    {
        $this->rowNumber++;
        $lastTx = $account->last_transaction_at
            ? \Carbon\Carbon::parse($account->last_transaction_at)->format('Y-m-d H:i:s')
            : 'Belum ada transaksi';

        return [
            $this->rowNumber,
            (string) $account->account_number,
            $account->customer_name ?? '-',
            ((int) $account->customer_id === 0) ? 'Instansi' : 'Santri',
            $account->product_name ?? $account->product?->product_name ?? '-',
            $account->status ?? '-',
            (float) $account->balance,
            $lastTx,
        ];
    }

    public function title(): string
    {
        return 'Saldo Terkini Rekening';
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $this->accounts->count() + 1;
        if ($lastRow >= 2) {
            $sheet->getStyle("G2:G{$lastRow}")
                ->getNumberFormat()
                ->setFormatCode('#,##0');
        }

        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}
