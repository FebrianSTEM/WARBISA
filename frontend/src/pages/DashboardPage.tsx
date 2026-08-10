import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';
import type { DashboardAnalyticsResponse } from '../api/dashboardApi';
import { AnalyticsCard } from '../components/dashboard/AnalyticsCard';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, AlertTriangle, Calendar } from 'lucide-react';

const MOCK_METRICS: DashboardAnalyticsResponse = {
  frequency: 'daily',
  grossSales: 12450000,
  netRevenue: 3120000,
  totalTransactions: 142,
  lowStockAlertCount: 2,
  paymentMethods: [
    { method: 'Cash', count: 95, totalAmount: 7470000, percentage: 60 },
    { method: 'QRIS', count: 35, totalAmount: 3735000, percentage: 30 },
    { method: 'Transfer', count: 12, totalAmount: 1245000, percentage: 10 },
  ],
  topSellingProducts: [
    { productId: 'p1', productName: 'Minyak Goreng Bimoli 1L', sku: 'BM-1L', totalQuantitySold: 48, totalRevenue: 888000 },
    { productId: 'p5', productName: 'Indomie Goreng Original 85g', sku: 'IDM-01', totalQuantitySold: 120, totalRevenue: 420000 },
    { productId: 'p2', productName: 'Beras Pandan Wangi 5kg', sku: 'BRS-5K', totalQuantitySold: 15, totalRevenue: 1080000 },
    { productId: 'p4', productName: 'Kopi Kapal Api Special 165g', sku: 'KPA-165', totalQuantitySold: 30, totalRevenue: 405000 },
    { productId: 'p3', productName: 'Gula Pasir Gulaku 1kg', sku: 'GLK-1K', totalQuantitySold: 25, totalRevenue: 400000 },
  ],
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [metrics, setMetrics] = useState<DashboardAnalyticsResponse>(MOCK_METRICS);

  const fetchMetrics = async () => {
    try {
      const data = await dashboardApi.getAnalytics(period);
      setMetrics(data);
    } catch {
      setMetrics(MOCK_METRICS);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Title & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            <span>Dashboard Finansial & Omset</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Ringkasan omset kotor, profit bersih, dan analitik metode pembayaran toko.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
          <Calendar className="w-4 h-4 text-slate-400 ml-2 mr-1" />
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'daily'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Harian
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'weekly'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Mingguan
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'monthly'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              period === 'yearly'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tahunan
          </button>
        </div>
      </div>

      {/* Analytics Card Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Gross Omset"
          value={formatCurrency(metrics.grossSales)}
          subtitle="Total pendapatan kotor"
          icon={TrendingUp}
          variant="emerald"
        />
        <AnalyticsCard
          title="Profit Bersih (Net)"
          value={formatCurrency(metrics.netRevenue)}
          subtitle="Pendapatan dikurangi HPP"
          icon={DollarSign}
          variant="emerald"
        />
        <AnalyticsCard
          title="Total Transaksi"
          value={`${metrics.totalTransactions} Transaksi`}
          subtitle="Total nota terkelola"
          icon={ShoppingBag}
          variant="sky"
        />
        <div
          onClick={() => navigate('/low-stock')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
          title="Klik untuk membuka Halaman Alert Low Stock"
        >
          <AnalyticsCard
            title="Barang Low Stock"
            value={`${metrics.lowStockAlertCount} Produk`}
            subtitle="Klik untuk buka alert & restock →"
            icon={AlertTriangle}
            variant={metrics.lowStockAlertCount > 0 ? 'rose' : 'amber'}
          />
        </div>
      </div>

      {/* Recharts Component */}
      <RevenueChart paymentDistributions={metrics.paymentMethods} />

      {/* Top 10 Best Revenue Products */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Top 10 Produk Revenue Tertinggi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase">
                <th className="pb-3">No</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Nama Produk</th>
                <th className="pb-3 text-center">Unit Terjual</th>
                <th className="pb-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-800">
              {metrics.topSellingProducts.map((prod, idx) => (
                <tr key={prod.productId}>
                  <td className="py-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="py-3 font-mono text-xs text-slate-500">{prod.sku}</td>
                  <td className="py-3 font-bold text-slate-900">{prod.productName}</td>
                  <td className="py-3 text-center tabular-nums">{prod.totalQuantitySold} Pcs</td>
                  <td className="py-3 text-right font-extrabold text-emerald-700 tabular-nums">
                    {formatCurrency(prod.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

