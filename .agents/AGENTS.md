# AGENTS.md — Workspace Rules (bank-santri)

## Tech Stack Backend Perbankan (bank-santri)
- Laravel 12, PHP 8.4 (path: `C:\Program Files\php-8.4.24`)
- Auth: JWT (`tymon/jwt-auth`)
- RBAC: `spatie/laravel-permission`
- Activity Log: `spatie/laravel-activitylog`
- Database: MySQL (semua environment)
  - Dev: `DB_DATABASE=bank_santri`, Host `127.0.0.1:3306`
- Queue: database driver

## Known Issue NPM
- `npm install` GAGAL karena `laravel-vite-plugin` tidak support Vite 8
- **Solusi:** `npm install --legacy-peer-deps`

## Rules Pengembangan
1. Semua route API ada di `routes/api.php`
2. Prefix route: `/api/master/*`, `/api/main/*`, `/api/koperasi/*`, `/api/internal/*`
3. Internal routes (dipanggil smp-be) menggunakan middleware `internal.key` (X-Internal-Key header)
4. Koperasi routes menggunakan middleware `koperasi.key` (X-Koperasi-Key header)
5. Autoprovision middleware di group master dan main (auto-setup berdasarkan user login)

## Konsep Keuangan
- `Account.account_number` = NIS santri (PRIMARY KEY bukan auto-increment integer)
- Transaction.id = UUID
- Status transaksi: `pending | success | failed | reversed`
- Channel: `teller | midtrans | bank_transfer | system`
- Akad syariah: `wadiah | mudharabah | ijarah | murabahah | qardh | wakalah`

## PaymentPackage
- `saku_amount` = total komponen uang saku (PaymentPackageItem dengan is_saku=true)
- `total_amount` = total semua komponen
- Gunakan `recalculateTotals()` setelah mengubah items

## Laporan Akuntansi (Reports)
- Jurnal → `/api/reports/journal`
- Trial Balance → `/api/reports/trial-balance`
- Laba Rugi → `/api/reports/profit-loss`
- Neraca → `/api/reports/balance-sheet`
