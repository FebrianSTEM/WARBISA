import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HourlyBuyingFrequency } from '../../api/dashboardApi';
import { Clock } from 'lucide-react';

interface PeakHoursChartProps {
  hourlyData: HourlyBuyingFrequency[];
}

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ hourlyData }) => {
  const peakHourItem = [...hourlyData].sort((a, b) => b.transactionCount - a.transactionCount)[0];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <span>Jam Sibuk & Frekuensi Pembelian (Peak Hours)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Distribusi jumlah transaksi & jam paling ramai pelanggan belanja toko.
          </p>
        </div>
        {peakHourItem && peakHourItem.transactionCount > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
            🔥 Jam Tersibuk: {peakHourItem.hourLabel} ({peakHourItem.transactionCount} Tx)
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="hour"
              tickFormatter={(hour) => `${hour}:00`}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
            <Tooltip
              labelFormatter={(label) => `Jam ${label}:00`}
              formatter={(val: any, name: any) => [
                name === 'transactionCount' ? `${val} Transaksi` : `Rp ${Number(val).toLocaleString('id-ID')}`,
                name === 'transactionCount' ? 'Jumlah Transaksi' : 'Total Omset',
              ]}
            />
            <Bar dataKey="transactionCount" fill="#4F46E5" radius={[6, 6, 0, 0]} name="transactionCount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
