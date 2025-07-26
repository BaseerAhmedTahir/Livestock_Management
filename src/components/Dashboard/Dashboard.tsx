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
import { useBusiness } from '../../context/BusinessContext';

type Trend = 'up' | 'down' | null;
interface Stat {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  trend: Trend;
}

export const DashboardStats: React.FC = memo(() => {
  const { goats, expenses, healthRecords, caretakers } = useApp();
  const { userRole } = useBusiness();

  const stats: Stat[] = useMemo(() => {
    /* -------------- maths (unchanged) -------------- */
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

    /* caretaker shares → owner earnings */
    let caretakerShares = 0;
    soldGoats.forEach((sg) => {
      const goat = goats.find((g) => g.id === sg.id);
      if (!goat?.salePrice) return;

      const caretaker = goat.caretakerId
        ? caretakers.find((c) => c.id === goat.caretakerId)
        : null;

      if (caretaker && caretaker.paymentModel.type === 'percentage') {
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

    /* helpers */
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(n);
    const margin = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

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
        value: fmt(totalInvestment),
        subtitle: `+ ${fmt(totalExpenses)} expenses`,
        icon: DollarSign,
        color: 'bg-purple-500',
        trend: null,
      },
      {
        title: 'Revenue Generated',
        value: fmt(totalRevenue),
        subtitle: `${soldGoats.length} goats sold`,
        icon: BarChart3,
        color: 'bg-emerald-500',
        trend: null,
      },
      {
        title: 'Net Profit',
        value: fmt(netProfit),
        subtitle: `${margin.toFixed(1)}% margin`,
        icon: Target,
        color: netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500',
        trend: netProfit >= 0 ? 'up' : 'down',
      },
      {
        title: 'Owner Earnings',
        value: fmt(ownerEarnings),
        subtitle: 'After caretaker shares',
        icon: DollarSign,
        color: ownerEarnings >= 0 ? 'bg-blue-500' : 'bg-red-500',
        trend: ownerEarnings >= 0 ? 'up' : 'down',
      },
    ];

    /* hide owner earnings if identical to net profit (no caretakers) */
    return ownerEarnings === netProfit && userRole === 'owner'
      ? cfg.filter((c) => c.title !== 'Owner Earnings')
      : cfg;
  }, [goats, expenses, healthRecords, caretakers, userRole]);

  /* ---------------------------- render ---------------------------- */
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map(({ title, value, subtitle, icon: Icon, color, trend }) => {
        const TrendIcon =
          trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

        return (
          <article
            key={title}
            tabIndex={0}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring focus-visible:ring-blue-500/40 dark:border-gray-700 dark:bg-gray-800 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              {/* numbers / text */}
              <div className="min-w-0">
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

              {/* badge: static on mobile, absolute on ≥sm */}
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color} sm:absolute sm:right-5 sm:top-5`}
              >
                <Icon className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
