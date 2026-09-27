import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper: Format Rupiah
const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount || 0);
};

// Helper: Format Date
const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Common PDF Header Generator
const generateBankSantriHeader = (doc, reportTitle, periodSubtitle) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138); // Blue-900
    doc.text('BANK SANTRI', 14, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text('Sistem Perbankan & Keuangan Pesantren', 14, 26);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(reportTitle.toUpperCase(), 14, 38);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text(periodSubtitle, 14, 44);
    
    // Dicetak pada
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    const now = new Date();
    doc.text(`Waktu Cetak: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`, doc.internal.pageSize.getWidth() - 14, 20, { align: 'right' });
    
    // Divider line
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.5);
    doc.line(14, 48, doc.internal.pageSize.getWidth() - 14, 48);
    
    return 54; // Return Y position after header
};

// Common Footer Page Numbers
const generatePageNumbers = (doc) => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
            `Halaman ${i} dari ${pageCount} | Bank Santri - Hak Cipta © ${new Date().getFullYear()}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }
};

/**
 * 1. JURNAL UMUM PDF
 */
export const printJournalPdf = (entries, dateRange, meta) => {
    const doc = new jsPDF('landscape');
    
    const periodText = dateRange?.start_date && dateRange?.end_date 
        ? `Periode: ${formatDate(dateRange.start_date)} s/d ${formatDate(dateRange.end_date)}`
        : 'Periode: Seluruh Riwayat';
        
    let startY = generateBankSantriHeader(doc, 'JURNAL UMUM (JOURNAL ENTRIES)', periodText);
    
    const tableBody = (entries || []).map(entry => [
        new Date(entry.transaction?.created_at).toLocaleDateString('id-ID') + '\n' + new Date(entry.transaction?.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}),
        entry.transaction?.reference_number || '-',
        entry.description,
        `${entry.coa?.account_name || entry.coa?.coa_name || ''}\n(${entry.coa_code})`,
        entry.debit > 0 ? formatIDR(entry.debit) : '-',
        entry.credit > 0 ? formatIDR(entry.credit) : '-'
    ]);
    
    autoTable(doc, {
        startY,
        head: [['Waktu', 'No Referensi', 'Keterangan', 'Akun (COA)', 'Debit', 'Kredit']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 8, cellPadding: 3, valign: 'middle' },
        columnStyles: {
            0: { cellWidth: 30, halign: 'center' },
            1: { cellWidth: 35, fontStyle: 'bold' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 45 },
            4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
            5: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });
    
    generatePageNumbers(doc);
    doc.save(`Jurnal_Umum_Bank_Santri_${Date.now()}.pdf`);
};

/**
 * 2. NERACA SALDO (TRIAL BALANCE) PDF
 */
export const printTrialBalancePdf = (data, meta, endDate) => {
    const doc = new jsPDF('portrait');
    
    const periodText = `Per Tanggal: ${formatDate(endDate)}`;
    let startY = generateBankSantriHeader(doc, 'NERACA SALDO (TRIAL BALANCE)', periodText);
    
    const isBalanced = Math.abs((meta?.total_debit || 0) - (meta?.total_credit || 0)) < 1;
    
    // Status box
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Ringkasan Total:', 14, startY + 4);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Debit: ${formatIDR(meta?.total_debit)}`, 14, startY + 10);
    doc.text(`Total Kredit: ${formatIDR(meta?.total_credit)}`, 14, startY + 16);
    
    doc.setFont('helvetica', 'bold');
    if (isBalanced) {
        doc.setTextColor(5, 150, 105); // Emerald-600
        doc.text('Status: SEIMBANG (BALANCED)', 100, startY + 16);
    } else {
        doc.setTextColor(225, 29, 72); // Rose-600
        doc.text('Status: TIDAK SEIMBANG (UNBALANCED)', 100, startY + 16);
    }
    
    const tableBody = (data || []).map(row => [
        row.coa_code,
        row.coa_name,
        row.account_type || '-',
        row.debit > 0 ? formatIDR(row.debit) : '-',
        row.credit > 0 ? formatIDR(row.credit) : '-',
        formatIDR(row.balance)
    ]);
    
    autoTable(doc, {
        startY: startY + 22,
        head: [['Kode Akun', 'Nama Akun', 'Tipe', 'Debit', 'Kredit', 'Saldo Akhir']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 'auto' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        },
        foot: [['', 'TOTAL AKUMULASI', '', formatIDR(meta?.total_debit), formatIDR(meta?.total_credit), '']],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
    });
    
    generatePageNumbers(doc);
    doc.save(`Neraca_Saldo_Bank_Santri_${endDate}.pdf`);
};

/**
 * 3. BUKU BESAR (GENERAL LEDGER) PDF
 */
export const printGeneralLedgerPdf = (accountInfo, entries, summary, dateRange) => {
    const doc = new jsPDF('portrait');
    
    const periodText = dateRange?.start_date && dateRange?.end_date 
        ? `Periode: ${formatDate(dateRange.start_date)} s/d ${formatDate(dateRange.end_date)}`
        : 'Periode: Seluruh Waktu';
        
    let startY = generateBankSantriHeader(doc, 'BUKU BESAR (GENERAL LEDGER)', periodText);
    
    // Account Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 24, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Akun: ${accountInfo?.code || ''} - ${accountInfo?.name || ''}`, 20, startY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tipe Akun: ${accountInfo?.type || '-'}`, 20, startY + 14);
    doc.text(`Posisi Normal: ${accountInfo?.normal_balance?.toUpperCase() || '-'}`, 20, startY + 20);
    
    // Summary info on the right side of the box
    doc.setFont('helvetica', 'bold');
    doc.text('Ringkasan Saldo', 130, startY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Saldo Awal: ${formatIDR(summary?.opening_balance)}`, 130, startY + 14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Saldo Akhir: ${formatIDR(summary?.closing_balance)}`, 130, startY + 20);
    
    const tableBody = (entries || []).map(e => [
        new Date(e.date).toLocaleDateString('id-ID'),
        e.reference_number || '-',
        e.description || '-',
        e.debit > 0 ? formatIDR(e.debit) : '-',
        e.credit > 0 ? formatIDR(e.credit) : '-',
        formatIDR(e.balance)
    ]);
    
    autoTable(doc, {
        startY: startY + 30,
        head: [['Tanggal', 'No Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo Kumulatif']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            0: { halign: 'center' },
            1: { fontStyle: 'bold' },
            2: { cellWidth: 'auto' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });
    
    generatePageNumbers(doc);
    doc.save(`Buku_Besar_${accountInfo?.code || 'Akun'}_${Date.now()}.pdf`);
};

/**
 * 4. LAPORAN LABA RUGI & NERACA PDF
 */
export const printFinancialStatementPdf = (type, data, dateRange) => {
    const doc = new jsPDF('portrait');
    
    const isPL = type === 'pl';
    const reportTitle = isPL ? 'LAPORAN LABA RUGI (PROFIT & LOSS)' : 'LAPORAN NERACA (BALANCE SHEET)';
    
    const periodText = isPL 
        ? `Periode: ${formatDate(dateRange.start_date)} s/d ${formatDate(dateRange.end_date)}`
        : `Per Tanggal: ${formatDate(dateRange.end_date)}`;
        
    let startY = generateBankSantriHeader(doc, reportTitle, periodText);
    
    if (isPL) {
        // --- LABA RUGI PENDAPATAN ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138); // Blue 900
        doc.text('PENDAPATAN (REVENUE)', 14, startY + 6);
        
        let plStartY = startY + 10;
        const revenueBody = (data?.revenue?.accounts || []).map(acc => [
            `${acc.coa_code} - ${acc.coa_name}`, formatIDR(acc.balance)
        ]);
        
        autoTable(doc, {
            startY: plStartY,
            head: [['Akun Pendapatan', 'Nominal']],
            body: revenueBody,
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [30, 58, 138] },
            columnStyles: { 1: { halign: 'right' } },
            foot: [['Total Pendapatan', formatIDR(data?.revenue?.total || 0)]],
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' }
        });
        
        plStartY = doc.lastAutoTable.finalY + 14;
        
        // --- LABA RUGI BEBAN ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(190, 18, 60); // Rose 700
        doc.text('BEBAN & BIAYA (EXPENSES)', 14, plStartY);
        
        const expenseBody = (data?.expense?.accounts || []).map(acc => [
            `${acc.coa_code} - ${acc.coa_name}`, formatIDR(acc.balance)
        ]);
        
        autoTable(doc, {
            startY: plStartY + 4,
            head: [['Akun Beban', 'Nominal']],
            body: expenseBody,
            theme: 'grid',
            headStyles: { fillColor: [254, 241, 242], textColor: [190, 18, 60] },
            columnStyles: { 1: { halign: 'right' } },
            foot: [['Total Beban', formatIDR(data?.expense?.total || 0)]],
            footStyles: { fillColor: [255, 228, 230], textColor: [15, 23, 42], fontStyle: 'bold' }
        });
        
        plStartY = doc.lastAutoTable.finalY + 14;
        
        // --- LABA BERSIH ---
        const netProfit = data?.net_profit || 0;
        const isProfit = netProfit >= 0;
        
        doc.setFillColor(isProfit ? 236 : 254, isProfit ? 253 : 242, isProfit ? 245 : 242);
        doc.setDrawColor(isProfit ? 167 : 253, isProfit ? 243 : 164, isProfit ? 208 : 175);
        doc.roundedRect(14, plStartY, doc.internal.pageSize.getWidth() - 28, 16, 2, 2, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(isProfit ? 'LABA BERSIH (NET PROFIT)' : 'RUGI BERSIH (NET LOSS)', 20, plStartY + 10);
        
        doc.setTextColor(isProfit ? 5 : 225, isProfit ? 150 : 29, isProfit ? 105 : 72);
        doc.text(formatIDR(Math.abs(netProfit)), doc.internal.pageSize.getWidth() - 20, plStartY + 10, { align: 'right' });
        
    } else {
        // --- NERACA ASET ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('ASET (AKTIVA)', 14, startY + 6);
        
        let bsStartY = startY + 10;
        const assetBody = (data?.assets?.accounts || []).map(acc => [
            `${acc.coa_code} - ${acc.coa_name}`, formatIDR(acc.balance)
        ]);
        
        autoTable(doc, {
            startY: bsStartY,
            head: [['Akun Aset', 'Saldo']],
            body: assetBody,
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
            columnStyles: { 1: { halign: 'right' } },
            foot: [['Total Aset', formatIDR(data?.assets?.total || 0)]],
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' }
        });
        
        bsStartY = doc.lastAutoTable.finalY + 14;
        
        // --- NERACA KEWAJIBAN & EKUITAS ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('KEWAJIBAN & EKUITAS (PASIVA)', 14, bsStartY);
        
        const liabilityBody = (data?.liabilities?.accounts || []).map(acc => [
            `${acc.coa_code} - ${acc.coa_name} (Kewajiban)`, formatIDR(acc.balance)
        ]);
        const equityBody = (data?.equity?.accounts || []).map(acc => [
            `${acc.coa_code} - ${acc.coa_name} (Ekuitas)`, formatIDR(acc.balance)
        ]);
        
        autoTable(doc, {
            startY: bsStartY + 4,
            head: [['Akun Kewajiban & Ekuitas', 'Saldo']],
            body: [...liabilityBody, ...equityBody],
            theme: 'grid',
            headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
            columnStyles: { 1: { halign: 'right' } },
            foot: [['Total Kewajiban & Ekuitas', formatIDR((data?.liabilities?.total || 0) + (data?.equity?.total || 0))]],
            footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' }
        });
        
        bsStartY = doc.lastAutoTable.finalY + 14;
        
        // --- BALANCE CHECK ---
        const totalAssets = data?.assets?.total || 0;
        const totalLiabilitiesEquity = (data?.liabilities?.total || 0) + (data?.equity?.total || 0);
        const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 1;
        
        doc.setFillColor(isBalanced ? 236 : 254, isBalanced ? 253 : 242, isBalanced ? 245 : 242);
        doc.setDrawColor(isBalanced ? 167 : 253, isBalanced ? 243 : 164, isBalanced ? 208 : 175);
        doc.roundedRect(14, bsStartY, doc.internal.pageSize.getWidth() - 28, 12, 2, 2, 'FD');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(isBalanced ? 5 : 225, isBalanced ? 150 : 29, isBalanced ? 105 : 72);
        doc.text(isBalanced ? 'STATUS: SEIMBANG (BALANCED)' : 'STATUS: TIDAK SEIMBANG (UNBALANCED)', 20, bsStartY + 8);
    }
    
    generatePageNumbers(doc);
    doc.save(`${isPL ? 'Laba_Rugi' : 'Neraca'}_Bank_Santri_${Date.now()}.pdf`);
};

/**
 * 5. REKONSILIASI TABUNGAN PDF (BERITA ACARA)
 */
export const printReconciliationPdf = (data) => {
    const doc = new jsPDF('portrait');
    
    const subLedger = data?.sub_ledger;
    const gl = data?.general_ledger;
    const recon = data?.reconciliation;
    const isBalanced = recon?.is_balanced;
    
    let startY = generateBankSantriHeader(doc, 'BERITA ACARA REKONSILIASI TABUNGAN', `Waktu Sinkronisasi Terakhir: ${formatDate(recon?.checked_at)}`);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('HASIL REKONSILIASI (SUMMARY)', 14, startY + 6);
    
    autoTable(doc, {
        startY: startY + 10,
        head: [['Keterangan', 'Nominal']],
        body: [
            ['Total Saldo Nasabah (Sub-Ledger)', formatIDR(subLedger?.total_balance)],
            ['Saldo Buku Besar (GL 2100 Tabungan Santri)', formatIDR(gl?.balance)],
            ['Selisih (Difference)', formatIDR(recon?.difference)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255 },
        columnStyles: { 
            0: { fontStyle: 'bold' },
            1: { halign: 'right', fontStyle: 'bold' } 
        }
    });
    
    let nextY = doc.lastAutoTable.finalY + 8;
    
    // Status box
    doc.setFillColor(isBalanced ? 236 : 254, isBalanced ? 253 : 242, isBalanced ? 245 : 242);
    doc.setDrawColor(isBalanced ? 167 : 253, isBalanced ? 243 : 164, isBalanced ? 208 : 175);
    doc.roundedRect(14, nextY, doc.internal.pageSize.getWidth() - 28, 14, 2, 2, 'FD');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(isBalanced ? 5 : 225, isBalanced ? 150 : 29, isBalanced ? 105 : 72);
    doc.text(isBalanced ? 'STATUS: SEIMBANG (MATCHED)' : 'STATUS: SELISIH (UNMATCHED)', 20, nextY + 9);
    
    nextY += 24;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('RINCIAN SUB-LEDGER NASABAH', 14, nextY);
    
    const accountsBody = (subLedger?.accounts || []).map(acc => [
        acc.account_number,
        acc.student?.first_name ? `${acc.student.first_name} ${acc.student.last_name || ''}`.trim() : '-',
        acc.status,
        formatIDR(acc.balance)
    ]);
    
    autoTable(doc, {
        startY: nextY + 4,
        head: [['Nomor Rekening', 'Nama Nasabah', 'Status', 'Saldo Tabungan']],
        body: accountsBody,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right', fontStyle: 'bold' }
        }
    });
    
    // Tanda Tangan
    nextY = doc.lastAutoTable.finalY + 20;
    
    // Pastikan ttd tidak terpotong ke halaman berikutnya
    if (nextY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        nextY = 20;
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    
    doc.text('Mengetahui,', 40, nextY, { align: 'center' });
    doc.text('Dibuat Oleh,', doc.internal.pageSize.getWidth() - 40, nextY, { align: 'center' });
    
    doc.text('___________________', 40, nextY + 25, { align: 'center' });
    doc.text('Manajer Keuangan', 40, nextY + 30, { align: 'center' });
    
    doc.text('___________________', doc.internal.pageSize.getWidth() - 40, nextY + 25, { align: 'center' });
    doc.text('Staf / Teller', doc.internal.pageSize.getWidth() - 40, nextY + 30, { align: 'center' });
    
    generatePageNumbers(doc);
    doc.save(`Rekonsiliasi_Tabungan_${Date.now()}.pdf`);
};

/**
 * 6. BUKTI TRANSAKSI (RECEIPT) PDF
 */
export const printReceiptPdf = (data, title = 'BUKTI TRANSAKSI') => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
    });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('BANK SANTRI', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Sistem Perbankan & Keuangan Pesantren', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(10, 24, doc.internal.pageSize.getWidth() - 10, 24);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), doc.internal.pageSize.getWidth() / 2, 32, { align: 'center' });
    
    let currentY = 40;
    
    const addRow = (label, value, isBold = false) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(label, 15, currentY);
        
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(value?.toString() || '-', doc.internal.pageSize.getWidth() - 15, currentY, { align: 'right' });
        currentY += 6;
    };
    
    addRow('Nomor Referensi', data.reference_number || data.payment_ref, true);
    addRow('Tanggal/Waktu', new Date(data.created_at || data.date || Date.now()).toLocaleString('id-ID'));
    addRow('Tipe Transaksi', data.transaction_type?.name || data.type || 'Manual');
    
    if (data.account_number) addRow('NIS / Rekening', data.account_number);
    if (data.customer_name) addRow('Nama Santri', data.customer_name);
    if (data.package_name) addRow('Paket / Pembayaran', data.package_name);
    if (data.status) addRow('Status', (data.status || '').toUpperCase(), true);
    
    currentY += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, doc.internal.pageSize.getWidth() - 15, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL NOMINAL', 15, currentY);
    
    doc.setFontSize(14);
    doc.text(formatIDR(data.amount || data.total_amount), doc.internal.pageSize.getWidth() - 15, currentY + 1, { align: 'right' });
    
    currentY += 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, doc.internal.pageSize.getWidth() - 15, currentY);
    currentY += 6;
    
    if (data.description) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        const splitText = doc.splitTextToSize(`Keterangan: ${data.description}`, doc.internal.pageSize.getWidth() - 30);
        doc.text(splitText, 15, currentY);
        currentY += (splitText.length * 4) + 4;
    }
    
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Petugas Kasir / Teller', doc.internal.pageSize.getWidth() - 15, currentY, { align: 'right' });
    
    currentY += 15;
    doc.text('(_________________________)', doc.internal.pageSize.getWidth() - 15, currentY, { align: 'right' });
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Dokumen ini adalah bukti transaksi yang sah dan dicetak secara otomatis oleh sistem Bank Santri.', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    
    doc.save(`Kuitansi_${data.reference_number || data.payment_ref || Date.now()}.pdf`);
};
