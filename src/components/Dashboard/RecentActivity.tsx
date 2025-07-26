// src/components/Dashboard/RecentActivity.tsx
import React, { memo, useMemo } from 'react';
import { Clock, DollarSign, Heart, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';

type Activity = {
  id: string;
  type: 'sale' | 'health' | 'weight' | 'expense';
  message: string;
  timestamp: Date;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string; // tailwind bg / text combo
};

export const RecentActivity: React.FC = memo(() => {
  const { goats, healthRecords, weightRecords, expenses } = useApp();

  /* ------------------------------------------------------------------ */
  /*                           BUILD ACTIVITY LIST                      */
  /* ------------------------------------------------------------------ */
  const activities: Activity[] = useMemo(() => {
    const list: Activity[] = [];

    /* ---------------- Sales ---------------- */
    goats
      .filter((g) => g.status === 'Sold' && g.saleDate)
      .sort(
        (a, b) =>
          new Date(b.saleDate as Date).getTime() -
          new Date(a.saleDate as Date).getTime(),
      )
      .slice(0, 2)
      .forEach((g) => {
        list.push({
          id: `sale-${g.id}`,
          type: 'sale',
          message: `${g.tagNumber} (${g.nickname || 'Unnamed'}) sold for ₨${(
            g.salePrice ?? 0
          ).toLocaleString()}`,
          timestamp: new Date(g.saleDate!),
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
        });
      });

    /* ---------------- Health ---------------- */
    healthRecords
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)
      .forEach((h) => {
        const goat = goats.find((g) => g.id === h.goatId);
        list.push({
          id: `health-${h.id}`,
          type: 'health',
          message: `${goat?.tagNumber} completed ${h.type.toLowerCase()} – ${
            h.description
          }`,
          timestamp: new Date(h.date),
          icon: Heart,
          color: 'text-red-600 bg-red-100 dark:bg-red-900/20',
        });
      });

    /* ---------------- Weight ---------------- */
    weightRecords
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)
      .forEach((w) => {
        const goat = goats.find((g) => g.id === w.goatId);
        list.push({
          id: `weight-${w.id}`,
          type: 'weight',
          message: `${goat?.tagNumber} weight updated to ${w.weight} kg`,
          timestamp: new Date(w.date),
          icon: Scale,
          color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        });
      });

    /* ---------------- Expenses ---------------- */
    expenses
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)
      .forEach((e) => {
        list.push({
          id: `expense-${e.id}`,
          type: 'expense',
          message: `${e.category} expense added – ₨${e.amount.toLocaleString()}`,
          timestamp: new Date(e.date),
          icon: DollarSign,
          color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
        });
      });

    return list
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [goats, healthRecords, weightRecords, expenses]);

  /* ------------------------------------------------------------------ */
  /*                               VIEW                                 */
  /* ------------------------------------------------------------------ */
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
        Recent Activity
      </h3>

      {activities.length ? (
        <ul className="space-y-4" role="list">
          {activities.map((act) => {
            const Icon = act.icon;
            return (
              <li key={act.id} className="flex items-start gap-3" role="listitem">
                {/* Icon chip */}
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${act.color}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>

                {/* Message + timestamp */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {act.message}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <time dateTime={act.timestamp.toISOString()}>
                      {format(act.timestamp, 'MMM dd, yyyy · h:mm a')}
                    </time>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        /* ---------------- Empty state ---------------- */
        <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
          <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            No recent activities
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Activities will appear as you use the system.
          </p>
        </div>
      )}
    </article>
  );
});

RecentActivity.displayName = 'RecentActivity';