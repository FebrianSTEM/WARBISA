import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import type { PaymentMethodBreakdown } from '../../api/dashboardApi';

interface RevenueChartProps {
  paymentDistributions: PaymentMethodBreakdown[];
}

const COLORS = ['#059669', '#3B82F6', '#F59E0B', '#EC4899'];

export const RevenueChart: React.FC<RevenueChartProps> = ({ paymentDistributions }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div>
        <h3 className="font-bold text-slate-900 text-base">Metode Pembayaran</h3>
        <p className="text-xs text-slate-500 font-medium">Persentase Tunai (Cash) vs QRIS vs Transfer</p>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={paymentDistributions}
              dataKey="totalAmount"
              nameKey="method"
              cx="50%"
              cy="50%"
              outerRadius={85}
              innerRadius={50}
              paddingAngle={4}
            >
              {paymentDistributions.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Total Omset']} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        {paymentDistributions.map((item) => (
          <div key={item.method} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <p className="font-semibold text-slate-500">{item.method}</p>
            <p className="font-extrabold text-slate-900 text-sm mt-0.5 tabular-nums">{formatCurrency(item.totalAmount)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.percentage}% ({item.count} Transaksi)</p>
          </div>
        ))}
      </div>
    </div>
  );
};

