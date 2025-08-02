// src/components/PerformanceChart/PerformanceChart.tsx
import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Defs,
  LinearGradient,
  Stop
} from 'recharts';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  isWithinInterval,
  format
} from 'date-fns';

import { useApp } from '../../context/AppContext';

/* -------------------------------------------------------------------------- */
/*                               Helper utils                                 */
/* -------------------------------------------------------------------------- */

const currency = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(n);

type ChartPoint = {
  month: string; // ● label
  investment: number;
  revenue: number;
  profit: number;
};

interface PerformanceChartProps {
  /** presets kept for future, but `year` is the default */
  dateRange?: 'year';
}

/* -------------------------------------------------------------------------- */
/*                              <PerformanceChart />                          */
/* -------------------------------------------------------------------------- */

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  dateRange = 'year'
}) => {
  const { goats, expenses, healthRecords } = useApp();

  /* ---------------------------- Assemble data --------------------------- */
  const data: ChartPoint[] = useMemo(() => {
    /* -- ALWAYS produce 12 points (last 12 months, chronological) -------- */
    const now = new Date();
    const points: ChartPoint[] = [];

    for (let i = 11; i >= 0; i--) {
      const date = subMonths(now, i); // e.g. i = 11 → 12 months ago (oldest)
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      /* Monthly (period) numbers ---------------------------------------- */
      const monthlyInvestment = goats
        .filter(g => isWithinInterval(g.purchaseDate, { start, end }))
        .reduce((a, g) => a + g.purchasePrice, 0);

      const monthlyRevenue = goats
        .filter(g => g.saleDate && isWithinInterval(g.saleDate, { start, end }))
        .reduce((a, g) => a + (g.salePrice ?? 0), 0);

      const monthlyExpense =
        expenses
          .filter(e => isWithinInterval(e.date, { start, end }))
          .reduce((a, e) => a + e.amount, 0) +
        healthRecords
          .filter(h => isWithinInterval(h.date, { start, end }))
          .reduce((a, h) => a + h.cost, 0);

      /* Cumulative up to *end* of this month ---------------------------- */
      const cumInvestment = goats
        .filter(g => g.purchaseDate <= end)
        .reduce((a, g) => a + g.purchasePrice, 0);

      const cumRevenue = goats
        .filter(g => g.saleDate && g.saleDate <= end)
        .reduce((a, g) => a + (g.salePrice ?? 0), 0);

      const cumExpense =
        expenses
          .filter(e => e.date <= end)
          .reduce((a, e) => a + e.amount, 0) +
        healthRecords
          .filter(h => h.date <= end)
          .reduce((a, h) => a + h.cost, 0);

      points.push({
        month: format(date, 'MMM'),
        investment: cumInvestment,
        revenue: cumRevenue,
        profit: cumRevenue - cumInvestment - cumExpense
      });
    }

    return points;
  }, [goats, expenses, healthRecords, dateRange]);

  const hasAnyData = data.some(
    d => d.investment !== 0 || d.revenue !== 0 || d.profit !== 0
  );

  /* ------------------------------- Render ------------------------------ */
  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white/90
                 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-neutral-700
                 dark:bg-neutral-800/90"
      aria-labelledby="performance-heading"
    >
      {/* Header */}
      <header className="border-b border-neutral-200 px-4 sm:px-5 py-4 dark:border-neutral-700">
        <h2
          id="performance-heading"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Financial Performance
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Cumulative investment, revenue &amp; profit (last&nbsp;12&nbsp;months)
        </p>
      </header>

      {/* Chart / Empty state */}
      <div className="h-[26rem] p-4 sm:p-5">
        {hasAnyData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -10, right: 10 }}>
              {/* grid */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(115,115,115,0.15)"
              />

              {/* axes */}
              <XAxis
                dataKey="month"
                tick={{ fill: '#737373', fontSize: 12, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#737373', fontSize: 12, fontWeight: 500 }}
                tickFormatter={v => `${Math.abs(v / 1000)}k`}
                axisLine={false}
                tickLine={false}
              />

              {/* tooltip */}
              <Tooltip
                formatter={(v: number) => currency(v)}
                labelStyle={{ color: '#404040', fontWeight: 600 }}
                contentStyle={{
                  background: 'var(--tw-bg-opacity)',
                  border: '1px solid #e5e5e5',
                  borderRadius: 8
                }}
              />

              {/* legend */}
              <Legend verticalAlign="top" height={30} />

              {/* gradient defs */}
              <defs>
                <linearGradient id="gradInv" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#d946ef" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradRev" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                </linearGradient>
                <linearGradient id="gradPro" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                </linearGradient>
              </defs>

              {/* lines */}
              <Line
                type="monotone"
                dataKey="investment"
                stroke="url(#gradInv)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#d946ef' }}
                activeDot={{ r: 6 }}
                name="Cumulative Investment"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="url(#gradRev)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#10b981' }}
                activeDot={{ r: 6 }}
                name="Cumulative Revenue"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="url(#gradPro)"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#3b82f6' }}
                activeDot={{ r: 6 }}
                name="Net Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          /* Empty-state */
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <span className="absolute inset-0 animate-ping rounded-full bg-neutral-200/60 dark:bg-neutral-600/40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                <svg
                  className="h-10 w-10 text-neutral-400 dark:text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2"
                  />
                </svg>
              </div>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              No Financial Data
            </h3>
            <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
              Add goats, sales, or expenses to see your yearly performance.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};