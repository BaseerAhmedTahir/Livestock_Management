// src/components/Dashboard/Dashboard.tsx
import React, { memo } from 'react';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { PerformanceChart } from './PerformanceChart';
import { BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';

interface DashboardProps {
  onViewAllBusinesses?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = memo(
  ({ onViewAllBusinesses }) => {
    const { goats, loading, error } = useApp();
    const { businesses, userRole } = useBusiness();

    /* ------------------------- Loading / Error / Empty ------------------------ */
    if (loading) return <LoadingSpinner />;

    if (error)
      return (
        <section className="mx-auto max-w-md px-4 pt-8">
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20"
          >
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Error loading data: {error}
            </p>
          </div>
        </section>
      );

    if (goats.length === 0)
      return (
        <section className="mx-auto max-w-lg px-4 pt-10 text-center">
          <header className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
              Welcome to LivestockPro
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Get started by adding your first goat to the system.
            </p>
          </header>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <svg
                className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              No Goats Added Yet
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              Start managing your livestock by adding your first goat. You’ll be able to track
              health records, weight changes, assign caretakers, and monitor your investment
              returns.
            </p>
          </div>
        </section>
      );

    /* --------------------------------  View  --------------------------------- */
    return (
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-10 md:px-6 lg:px-8">
        {/* Heading */}
        <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
              Dashboard Overview
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Welcome back! Here’s what’s happening with your livestock.
            </p>
          </div>

          {userRole === 'owner' &&
            businesses.length > 1 &&
            onViewAllBusinesses && (
              <button
                type="button"
                onClick={onViewAllBusinesses}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500/70 active:scale-95 transition"
              >
                <BarChart3 className="h-5 w-5" />
                <span>View All Businesses</span>
              </button>
            )}
        </header>

        {/* KPI cards (hide Owner-Earnings if it equals Net-Profit) */}
        <DashboardStats />

        {/* Chart + Activity */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PerformanceChart />
          <RecentActivity />
        </div>
      </section>
    );
  },
);

Dashboard.displayName = 'Dashboard';
