// src/components/DashboardStats/DashboardStats.tsx
import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  BarChart3,
  Target
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';

/* -------------------------------------------------------------------------- */
/*                               Helper Types                                 */
/* -------------------------------------------------------------------------- */

type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  Icon: React.ElementType;
  colorClass: string;
  trend?: 'up' | 'down';
};

/* -------------------------------------------------------------------------- */
/*                               <StatCard />                                 */
/* -------------------------------------------------------------------------- */

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  Icon,
  colorClass,
  trend
}) => {
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm
                 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:scale-105"
      aria-label={title}
    >
      {/* decorative gradient blob */}
      <span
        className={`pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full ${colorClass} blur-3xl opacity-20 transition-opacity duration-700 group-hover:opacity-50`}
      />

      <div className="flex items-center justify-between gap-4 p-4 sm:p-6">
        {/* ---------------------------------------------------------------- */}
        {/*                             Text area                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex-1">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {title}
          </p>

          <p className="text-xl font-black text-neutral-900 dark:text-neutral-100 sm:text-2xl md:text-3xl">
            {value}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">
              {subtitle}
            </p>

            {TrendIcon && (
              <TrendIcon
                className={`h-4 w-4 ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}
              />
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/*                             Icon blob                            */}
        {/* ---------------------------------------------------------------- */}
        <div
          className={`flex shrink-0 items-center justify-center rounded-xl p-3 shadow-lg
                      transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125 ${colorClass}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                          <DashboardStats />                                */
/* -------------------------------------------------------------------------- */

export const DashboardStats: React.FC = () => {
  const { goats, expenses, healthRecords, caretakers } = useApp();
  const { activeBusiness } = useBusiness();

  /* ----------------------------- Calculations ---------------------------- */
  const {
    totalGoats,
    activeGoats,
    soldGoats,
    totalInvestment,
    totalRevenue,
    totalExpenses,
    netProfit,
    ownerEarnings,
    profitMargin
  } = useMemo(() => {
    // Basic aggregations
    const totalGoats = goats.length;
    const activeGoats = goats.filter(g => g.status === 'Active');
    const soldGoats = goats.filter(g => g.status === 'Sold');

    const totalInvestment = goats.reduce((sum, g) => sum + g.purchasePrice, 0);
    const totalRevenue   = goats.reduce((sum, g) => sum + (g.salePrice ?? 0), 0);

    const careExpenses   = expenses.reduce((s, e) => s + e.amount, 0);
    const healthCost     = healthRecords.reduce((s, r) => s + r.cost, 0);
    const totalExpenses  = careExpenses + healthCost;

    const netProfit = totalRevenue - totalInvestment - totalExpenses;

    /* -------------- Owner earnings (caretaker share deducted) ------------ */
    let caretakerShares = 0;

    soldGoats.forEach(goat => {
      if (!goat.salePrice || !activeBusiness) return;

      const caretaker = goat.caretakerId
        ? caretakers.find(c => c.id === goat.caretakerId)
        : null;
      if (!caretaker) return;

      if (activeBusiness.paymentModelType === 'percentage') {
        // expenses specific to this goat
        const goatSpecificExpenses =
          expenses.filter(e => e.goatId === goat.id).reduce((s, e) => s + e.amount, 0) +
          healthRecords.filter(h => h.goatId === goat.id).reduce((s, h) => s + h.cost, 0);

        // shared expenses across active goats
        const generalExpenses = expenses.filter(e => !e.goatId).reduce((s, e) => s + e.amount, 0);
        const sharedPerGoat   = activeGoats.length ? generalExpenses / activeGoats.length : 0;

        const goatProfit =
          goat.salePrice - goat.purchasePrice - goatSpecificExpenses - sharedPerGoat;

        caretakerShares += (goatProfit * activeBusiness.paymentModelAmount) / 100;
      }

      if (activeBusiness.paymentModelType === 'monthly') {
        if (goat.purchaseDate && goat.saleDate) {
          const months =
            Math.max(
              1,
              Math.floor(
                (goat.saleDate.getTime() - goat.purchaseDate.getTime()) /
                  (1000 * 60 * 60 * 24 * 30)
              )
            );
          caretakerShares += activeBusiness.paymentModelAmount * months;
        }
      }
    });

    const ownerEarnings = netProfit - caretakerShares;
    const profitMargin  = totalRevenue ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalGoats,
      activeGoats,
      soldGoats,
      totalInvestment,
      totalRevenue,
      totalExpenses,
      netProfit,
      ownerEarnings,
      profitMargin
    };
  }, [goats, expenses, healthRecords, caretakers, activeBusiness]);

  /* ---------------------------- Utils & Data ---------------------------- */
  const money = (amt: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amt);

  const stats: StatCardProps[] = [
    {
      title: 'Total Goats',
      value: totalGoats.toString(),
      subtitle: `${activeGoats.length} Active • ${soldGoats.length} Sold`,
      Icon: Users,
      colorClass: 'bg-gradient-to-tr from-indigo-500 to-blue-500'
    },
    {
      title: 'Total Investment',
      value: money(totalInvestment),
      subtitle: `${money(totalExpenses)} total expenses`,
      Icon: DollarSign,
      colorClass: 'bg-gradient-to-tr from-teal-500 to-emerald-500'
    },
    {
      title: 'Revenue Generated',
      value: money(totalRevenue),
      subtitle: `${soldGoats.length} goats sold`,
      Icon: BarChart3,
      colorClass: 'bg-gradient-to-tr from-fuchsia-500 to-pink-500'
    },
    {
      title: 'Net Profit',
      value: money(netProfit),
      subtitle: `${profitMargin.toFixed(1)}% margin`,
      Icon: Target,
      colorClass:
        netProfit >= 0
          ? 'bg-gradient-to-tr from-emerald-500 to-green-500'
          : 'bg-gradient-to-tr from-rose-500 to-red-500',
      trend: netProfit >= 0 ? 'up' : 'down'
    },
    {
      title: 'Owner Earnings',
      value: money(ownerEarnings),
      subtitle: 'After caretaker shares',
      Icon: DollarSign,
      colorClass:
        ownerEarnings >= 0
          ? 'bg-gradient-to-tr from-purple-500 to-violet-500'
          : 'bg-gradient-to-tr from-rose-500 to-red-500',
      trend: ownerEarnings >= 0 ? 'up' : 'down'
    }
  ];

  /* ------------------------------ Render -------------------------------- */
  return (
    <section
      className="grid gap-4 sm:gap-6 
                 [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))]"
      data-testid="dashboard-stats"
    >
      {stats.map(stat => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          Icon={stat.Icon}
          colorClass={stat.colorClass}
          trend={stat.trend}
        />
      ))}
    </section>
  );
};