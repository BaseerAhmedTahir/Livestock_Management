// src/components/Dashboard/DashboardStats.tsx
import React, { memo, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Target,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

/* ------------------------------------------------------------------ */
/*                               TYPES                                */
/* ------------------------------------------------------------------ */
type Trend = 'up' | 'down' | null;

interface Stat {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  trend: Trend;
}

/* ------------------------------------------------------------------ */
/*                              COMPONENT                             */
/* ------------------------------------------------------------------ */
export const DashboardStats: React.FC = memo(() => {
  const { goats, expenses, healthRecords, caretakers } = useApp();

  /* ----------------------------- Memoised maths ----------------------------- */
  const stats: Stat[] = useMemo(() => {
    /* ---------- Raw numbers ---------- */
    const totalGoats = goats.length;
    const activeGoats = goats.filter((g) => g.status === 'Active');
    const soldGoats = goats.filter((g) => g.status === 'Sold');

    const totalInvestment = goats.reduce((s, g) => s + g.purchasePrice, 0);
    const totalRevenue = goats
      .filter((g) => g.salePrice)
      .reduce((s, g) => s + (g.salePrice ?? 0), 0);

    const careExp = expenses.reduce((s, e) => s + e.amount, 0);
    const healthExp = healthRecords.reduce((s, h) => s + h.cost, 0);
    const totalExpenses = careExp + healthExp;

    const netProfit = totalRevenue - totalInvestment - totalExpenses;

    /* ---------- Calculate owner earnings ---------- */
    let caretakerShares = 0;
    soldGoats.forEach((sg) => {
      const goat = goats.find((g) => g.id === sg.id);
      if (!goat?.salePrice) return;

      const caretaker = goat.caretakerId
        ? caretakers.find((c) => c.id === goat.caretakerId)
        : null;

      if (caretaker && caretaker.paymentModel.type === 'percentage') {
        // specific + shared + health expenses
        const specific = expenses
          .filter((e) => e.goatId === goat.id)
          .reduce((s, e) => s + e.amount, 0);

        const shared =
          expenses.filter((e) => !e.goatId).reduce((s, e) => s + e.amount, 0) /
          Math.max(1, activeGoats.length);

        const health = healthRecords
          .filter((h) => h.goatId === goat.id)
          .reduce((s, h) => s + h.cost, 0);

        const goatProfit =
          goat.salePrice - goat.purchasePrice - (specific + shared + health);

        caretakerShares += (goatProfit * caretaker.paymentModel.amount) / 100;
      }
    });
    const ownerEarnings = netProfit - caretakerShares;

    /* ---------- Helpers ---------- */
    const formatPKR = (n: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(n);

    const margin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

    /* ---------- Stat config ---------- */
    const cfg: Stat[] = [
      {
        title: 'Total Goats',
        value: totalGoats.toString(),
        subtitle: `${activeGoats.length} active, ${soldGoats.length} sold`,
        icon: Users,
        color: 'bg-blue-500',
        trend: null,
      },
      {
        title: 'Total Investment',
        value: formatPKR(totalInvestment),
        subtitle: `+ ${formatPKR(totalExpenses)} expenses`,
        icon: DollarSign,
        color: 'bg-purple-500',
        trend: null,
      },
      {
        title: 'Revenue Generated',
        value: formatPKR(totalRevenue),
        subtitle: `${soldGoats.length} goats sold`,
        icon: BarChart3,
        color: 'bg-emerald-500',
        trend: null,
      },
      {
        title: 'Net Profit',
        value: formatPKR(netProfit),
        subtitle: `${margin.toFixed(1)}% margin`,
        icon: Target,
        color: netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500',
        trend: netProfit >= 0 ? 'up' : 'down',
      },
      {
        title: 'Owner Earnings',
        value: formatPKR(ownerEarnings),
        subtitle: 'After caretaker shares',
        icon: DollarSign,
        color: ownerEarnings >= 0 ? 'bg-blue-500' : 'bg-red-500',
        trend: ownerEarnings >= 0 ? 'up' : 'down',
      },
    ];

    return cfg;
  }, [goats, expenses, healthRecords, caretakers]);

  /* ------------------------------- RENDER ---------------------------------- */
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(({ title, value, subtitle, icon: Icon, color, trend }) => {
        const TrendIcon =
          trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

        return (
          <article
            key={title}
            tabIndex={0}
            className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* Left – numbers */}
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {title}
              </h4>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50">
                {value}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
                {TrendIcon && (
                  <TrendIcon
                    aria-label={trend === 'up' ? 'Positive trend' : 'Negative trend'}
                    className={`h-4 w-4 ${
                      trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Right – coloured circle icon */}
            <span
              className={`absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full ${color}`}
            >
              <Icon className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
          </article>
        );
      })}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';