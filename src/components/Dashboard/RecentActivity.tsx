// src/components/RecentActivity/RecentActivity.tsx
import React, { useMemo } from 'react';
import {
  Clock,
  DollarSign,
  Heart,
  Scale
} from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';

/* -------------------------------------------------------------------------- */
/*                            Types & Utilities                               */
/* -------------------------------------------------------------------------- */

type ActivityBase = {
  id: string;
  message: string;
  timestamp: Date;
  Icon: React.ElementType;
  colorClass: string;
};

const currency = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0
  }).format(n);

/* -------------------------------------------------------------------------- */
/*                          <ActivityItem />                                  */
/* -------------------------------------------------------------------------- */

const ActivityItem: React.FC<ActivityBase> = ({
  message,
  timestamp,
  Icon,
  colorClass
}) => (
  <li
    className="group flex items-start gap-3 rounded-xl p-3 
               transition-colors duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-700"
  >
    {/* icon */}
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg p-3 shadow-inner ${colorClass}`}
    >
      <Icon className="h-5 w-5" />
    </div>

    {/* content */}
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {message}
      </p>

      <div className="mt-1 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
        <Clock className="mr-1.5 h-4 w-4" />
        {format(timestamp, 'MMM dd, yyyy · h:mm a')}
      </div>
    </div>
  </li>
);

/* -------------------------------------------------------------------------- */
/*                         <RecentActivity />                                 */
/* -------------------------------------------------------------------------- */

export const RecentActivity: React.FC = () => {
  const { goats, healthRecords, weightRecords, expenses } = useApp();

  /* --------------------------- Build activity list ----------------------- */
  const activities = useMemo<ActivityBase[]>(() => {
    const items: ActivityBase[] = [];

    /* recent sales ------------------------------------------------------- */
    goats
      .filter(g => g.status === 'Sold' && g.saleDate)
      .sort((a, b) => (b.saleDate?.getTime() ?? 0) - (a.saleDate?.getTime() ?? 0))
      .slice(0, 2)
      .forEach(g =>
        items.push({
          id: `sale-${g.id}`,
          message: `${g.tagNumber} (${g.nickname || 'Unnamed'}) sold for ${currency(
            g.salePrice!
          )}`,
          timestamp: g.saleDate!,
          Icon: DollarSign,
          colorClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-700/40'
        })
      );

    /* recent health ------------------------------------------------------ */
    healthRecords
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 2)
      .forEach(r => {
        const goat = goats.find(g => g.id === r.goatId);
        items.push({
          id: `health-${r.id}`,
          message: `${goat?.tagNumber} · ${r.type.toLowerCase()} – ${r.description}`,
          timestamp: r.date,
          Icon: Heart,
          colorClass: 'bg-rose-100 text-rose-600 dark:bg-rose-700/40'
        });
      });

    /* recent weight ------------------------------------------------------ */
    weightRecords
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 2)
      .forEach(r => {
        const goat = goats.find(g => g.id === r.goatId);
        items.push({
          id: `weight-${r.id}`,
          message: `${goat?.tagNumber} weight updated to ${r.weight} kg`,
          timestamp: r.date,
          Icon: Scale,
          colorClass: 'bg-sky-100 text-sky-600 dark:bg-sky-700/40'
        });
      });

    /* recent expenses ---------------------------------------------------- */
    expenses
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 2)
      .forEach(e =>
        items.push({
          id: `expense-${e.id}`,
          message: `${e.category} expense – ${currency(e.amount)}`,
          timestamp: e.date,
          Icon: DollarSign,
          colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-700/40'
        })
      );

    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [goats, healthRecords, weightRecords, expenses]);

  /* ------------------------------- Render ------------------------------- */
  return (
    <section
      className="rounded-2xl border border-neutral-200 bg-white/90 shadow-lg
                 backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-800/90 hover:shadow-xl transition-all duration-300"
      aria-labelledby="recent-activity-heading"
    >
      {/* header */}
      <header className="border-b border-neutral-200 px-4 sm:px-5 py-4 dark:border-neutral-700">
        <h2
          id="recent-activity-heading"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Recent Activity
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Latest updates from your livestock operations
        </p>
      </header>

      {/* content */}
      <div className="p-4 sm:p-5">
        {activities.length ? (
          <ul className="space-y-4">
            {activities.map(act => (
              <ActivityItem key={act.id} {...act} />
            ))}
          </ul>
        ) : (
          /* empty-state */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-5">
              {/* pulsing ring */}
              <span className="absolute inset-0 animate-ping rounded-full bg-neutral-200/60 dark:bg-neutral-600/40" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                <Clock className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
              </div>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-neutral-700 dark:text-neutral-300">
              No Recent Activity
            </h3>
            <p className="max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
              Your updates will appear here as you manage goats, health checks,
              and expenses.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};