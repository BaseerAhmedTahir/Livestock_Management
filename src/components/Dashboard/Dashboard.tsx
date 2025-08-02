// src/components/Dashboard/Dashboard.tsx
import React from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { PerformanceChart } from './PerformanceChart';
import { LoadingSpinner } from '../UI/LoadingSpinner';

import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';

interface DashboardProps {
  onViewAllBusinesses?: () => void;
  onAddGoat?: () => void; // optional CTA handler for empty state
}

export const Dashboard: React.FC<DashboardProps> = ({
  onViewAllBusinesses,
  onAddGoat
}) => {
  const { goats, loading, error } = useApp();
  const { businesses, userRole } = useBusiness();

  /* ---------------------------------------------------------------------- */
  /*                                States                                  */
  /* ---------------------------------------------------------------------- */
  if (loading)
    return (
      <div className="flex h-80 w-full items-center justify-center">
        <LoadingSpinner label="Loading dashboard…" />
      </div>
    );

  if (error)
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
        <h2 className="text-lg font-semibold">Unable to load data</h2>
        <p>{error}</p>
      </section>
    );

  /* ------------------------------ Empty state --------------------------- */
  if (!goats.length)
    return (
      <section className="mx-auto max-w-xl space-y-6 text-center">
        <header>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Welcome to LivestockPro
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Get started by adding your first goat.
          </p>
        </header>

        <div className="rounded-2xl border border-neutral-200 bg-white/70 p-10 shadow-lg dark:border-neutral-700 dark:bg-neutral-800/70">
          <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-700/40">
            <Plus className="h-10 w-10 text-emerald-600 dark:text-emerald-300" />
          </span>

          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            No goats yet
          </h3>
          <p className="mx-auto mt-2 max-w-xs text-sm text-neutral-600 dark:text-neutral-400">
            Track health, weight, caretakers, and returns once you add goats to
            the system.
          </p>

          {onAddGoat && (
            <button
              onClick={onAddGoat}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add goat
            </button>
          )}
        </div>
      </section>
    );

  /* ----------------------------- Main content --------------------------- */
  return (
    <section className="space-y-8 pb-16">
      {/* header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            Dashboard Overview
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Welcome back — here’s what’s happening with your livestock.
          </p>
        </div>

        {userRole === 'owner' && businesses.length > 1 && onViewAllBusinesses && (
          <button
            onClick={onViewAllBusinesses}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            <BarChart3 className="h-5 w-5" />
            View all businesses
          </button>
        )}
      </header>

      {/* KPI cards */}
      <DashboardStats />

      {/* Chart + activity feed */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart />
        <RecentActivity />
      </div>
    </section>
  );
};