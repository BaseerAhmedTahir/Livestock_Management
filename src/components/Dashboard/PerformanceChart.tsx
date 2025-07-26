// src/components/Dashboard/PerformanceChart.tsx
import React, { memo, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
} from 'date-fns';

export const PerformanceChart: React.FC = memo(() => {
  const { goats, expenses, healthRecords } = useApp();

  /* ------------------------------------------------------------------ */
  /*                        BUILD 12-MONTH DATA                         */
  /* ------------------------------------------------------------------ */
  const data = useMemo(() => {
    const months: {
      month: string;
      investment: number;
      revenue: number;
      profit: number;
      expenses: number;
    }[] = [];

    const now = new Date();

    // helper to check date in range (inclusive)
    const inRange = (d: Date, start: Date, end: Date) =>
      (isAfter(d, start) || d.getTime() === start.getTime()) &&
      (isBefore(d, end) || d.getTime() === end.getTime());

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      /* ---- monthly values ---- */
      const monthlyInvestment = goats
        .filter((g) =>
          inRange(new Date(g.purchaseDate), monthStart, monthEnd),
        )
        .reduce((sum, g) => sum + g.purchasePrice, 0);

      const monthlyRevenue = goats
        .filter(
          (g) =>
            g.saleDate &&
            inRange(new Date(g.saleDate), monthStart, monthEnd),
        )
        .reduce((sum, g) => sum + (g.salePrice ?? 0), 0);

      const monthlyExpenses =
        expenses
          .filter((e) => inRange(new Date(e.date), monthStart, monthEnd))
          .reduce((s, e) => s + e.amount, 0) +
        healthRecords
          .filter((h) => inRange(new Date(h.date), monthStart, monthEnd))
          .reduce((s, h) => s + h.cost, 0);

      /* ---- cumulative values (up to monthEnd) ---- */
      const cumulativeInvestment = goats
        .filter((g) => new Date(g.purchaseDate) <= monthEnd)
        .reduce((s, g) => s + g.purchasePrice, 0);

      const cumulativeRevenue = goats
        .filter((g) => g.saleDate && new Date(g.saleDate) <= monthEnd)
        .reduce((s, g) => s + (g.salePrice ?? 0), 0);

      const cumulativeExpenses =
        expenses
          .filter((e) => new Date(e.date) <= monthEnd)
          .reduce((s, e) => s + e.amount, 0) +
        healthRecords
          .filter((h) => new Date(h.date) <= monthEnd)
          .reduce((s, h) => s + h.cost, 0);

      const profit =
        cumulativeRevenue - cumulativeInvestment - cumulativeExpenses;

      months.push({
        month: format(monthDate, 'MMM'),
        investment: cumulativeInvestment,
        revenue: cumulativeRevenue,
        profit,
        expenses: monthlyExpenses,
      });
    }

    return months; // keep all 12 months, even if values are 0
  }, [goats, expenses, healthRecords]);

  const hasData = data.some(
    (d) => d.investment > 0 || d.revenue > 0 || d.expenses > 0,
  );

  /* ------------------------------------------------------------------ */
  /*                               VIEW                                 */
  /* ------------------------------------------------------------------ */
  const formatPKR = (n: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
        Financial Performance (Last 12 Months)
      </h3>

      {hasData ? (
        <div className="aspect-[16/9]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(v) => `₨${v / 1000}k`}
              />
              <Tooltip
                formatter={(v: number) => formatPKR(v)}
                labelStyle={{ color: '#374151' }}
              />
              <Line
                type="monotone"
                dataKey="investment"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Cumulative Investment"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Cumulative Revenue"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Net Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* -------------- Empty state -------------- */
        <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
          <svg
            className="h-10 w-10 text-gray-300 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19V9a2 2 0 012-2h6M7 19V5a2 2 0 012-2h6m-6 0v16"
            />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No financial data yet
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Add goats and transactions to see the chart.
          </p>
        </div>
      )}
    </article>
  );
});

PerformanceChart.displayName = 'PerformanceChart';