import type { DashboardAnalyticsResponse } from '../api/dashboardApi';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const exportDashboardToExcel = (metrics: DashboardAnalyticsResponse, period: string) => {
  const dateStr = new Date().toLocaleDateString('id-ID');
  let csvContent = '\uFEFF'; // UTF-8 BOM for Excel

  csvContent += `LAPORAN ANALITIK DASHBOARD FINANSIAL WASERBI\n`;
  csvContent += `Periode Laporan,${period.toUpperCase()}\n`;
  csvContent += `Tanggal Cetak,${dateStr}\n\n`;

  // Summary Metrics Section
  csvContent += `RINGKASAN METRIK FINANSIAL\n`;
  csvContent += `Metrik,Nilai\n`;
  csvContent += `Gross Omset,"${formatCurrency(metrics.grossSales)}"\n`;
  csvContent += `Profit Bersih (Net),"${formatCurrency(metrics.netRevenue)}"\n`;
  csvContent += `Total Transaksi,${metrics.totalTransactions}\n`;
  csvContent += `Barang Low Stock,${metrics.lowStockAlertCount}\n\n`;

  // Payment Method Section
  csvContent += `BREAKDOWN METODE PEMBAYARAN\n`;
  csvContent += `Metode Pembayaran,Jumlah Transaksi,Total Omset,Persentase\n`;
  metrics.paymentMethods.forEach((pm) => {
    csvContent += `"${pm.method}",${pm.count},"${formatCurrency(pm.totalAmount)}",${pm.percentage}%\n`;
  });
  csvContent += `\n`;

  // Top 5 Categories Section
  csvContent += `TOP 5 KATEGORI TERLARIS\n`;
  csvContent += `No,Nama Kategori,Unit Terjual,Total Revenue,Persentase\n`;
  (metrics.topSellingCategories || []).forEach((cat, idx) => {
    csvContent += `${idx + 1},"${cat.categoryName}",${cat.totalQuantitySold},"${formatCurrency(cat.totalRevenue)}",${cat.percentage}%\n`;
  });
  csvContent += `\n`;

  // Top 10 Products Section
  csvContent += `TOP 10 PRODUK REVENUE TERTINGGI\n`;
  csvContent += `No,SKU,Nama Produk,Unit Terjual,Total Revenue\n`;
  (metrics.topSellingProducts || []).forEach((prod, idx) => {
    csvContent += `${idx + 1},"${prod.sku}","${prod.productName}",${prod.totalQuantitySold},"${formatCurrency(prod.totalRevenue)}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `WASERBI_Laporan_Dashboard_${period}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDashboardToPDF = (metrics: DashboardAnalyticsResponse, period: string) => {
  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laporan Dashboard WASERBI — ${period.toUpperCase()}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; }
        .header { border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 24px; font-weight: bold; color: #0f172a; }
        .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
        .badge { background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
        .card-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold; }
        .card-value { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 6px; }
        .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 25px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #475569; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; pt: 15px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">WASERBI — Laporan Finansial Toko</div>
          <div class="subtitle">Dicetak pada: ${dateStr} • Filter Periode: ${period.toUpperCase()}</div>
        </div>
        <span class="badge">Sistem WASERBI POS</span>
      </div>

      <div class="metrics-grid">
        <div class="card">
          <div class="card-label">Gross Omset</div>
          <div class="card-value">${formatCurrency(metrics.grossSales)}</div>
        </div>
        <div class="card">
          <div class="card-label">Profit Bersih (Net)</div>
          <div class="card-value">${formatCurrency(metrics.netRevenue)}</div>
        </div>
        <div class="card">
          <div class="card-label">Total Transaksi</div>
          <div class="card-value">${metrics.totalTransactions} Tx</div>
        </div>
        <div class="card">
          <div class="card-label">Low Stock Alert</div>
          <div class="card-value">${metrics.lowStockAlertCount} Produk</div>
        </div>
      </div>

      <div class="section-title">Breakdown Metode Pembayaran</div>
      <table>
        <thead>
          <tr>
            <th>Metode Pembayaran</th>
            <th class="text-center">Jumlah Transaksi</th>
            <th class="text-right">Total Omset</th>
            <th class="text-right">Persentase</th>
          </tr>
        </thead>
        <tbody>
          ${metrics.paymentMethods.map(pm => `
            <tr>
              <td><strong>${pm.method}</strong></td>
              <td class="text-center">${pm.count}</td>
              <td class="text-right"><strong>${formatCurrency(pm.totalAmount)}</strong></td>
              <td class="text-right">${pm.percentage}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Top 5 Kategori Paling Laris</div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Kategori</th>
            <th class="text-center">Unit Terjual</th>
            <th class="text-right">Total Revenue</th>
            <th class="text-right">Persentase</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.topSellingCategories || []).map((cat, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${cat.categoryName}</strong></td>
              <td class="text-center">${cat.totalQuantitySold} Unit</td>
              <td class="text-right"><strong>${formatCurrency(cat.totalRevenue)}</strong></td>
              <td class="text-right">${cat.percentage}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="section-title">Top 10 Produk Revenue Tertinggi</div>
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>SKU</th>
            <th>Nama Produk</th>
            <th class="text-center">Unit Terjual</th>
            <th class="text-right">Total Revenue</th>
          </tr>
        </thead>
        <tbody>
          ${(metrics.topSellingProducts || []).map((p, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td><code>${p.sku}</code></td>
              <td><strong>${p.productName}</strong></td>
              <td class="text-center">${p.totalQuantitySold} Pcs</td>
              <td class="text-right"><strong>${formatCurrency(p.totalRevenue)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Laporan resmi dibuat otomatis oleh Sistem Point of Sale & Inventory WASERBI.
      </div>
    </body>
    </html>
  `;

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(htmlContent);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 300);
};
