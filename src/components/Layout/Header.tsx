// src/components/Layout/Header.tsx
import React, { memo, useMemo, useState } from 'react';
import { Bell, User, BarChart3, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessSelector } from '../Business/BusinessSelector';

interface HeaderProps {
  title: string;
  /* Only “All Businesses” button for owners */
  onViewAllBusinesses?: () => void;
}

export const Header: React.FC<HeaderProps> = memo(
  ({ title, onViewAllBusinesses }) => {
    /* ------------------------------------------------------------------ */
    /*                              CONTEXT                               */
    /* ------------------------------------------------------------------ */
    const { user, signOut } = useAuth();
    const { healthRecords, goats } = useApp();
    const { userRole } = useBusiness();

    /* ------------------------------------------------------------------ */
    /*                              STATE                                 */
    /* ------------------------------------------------------------------ */
    const [showProfile, setShowProfile] = useState(false);
    const [showNotif, setShowNotif] = useState(false);

    /* ------------------------------------------------------------------ */
    /*                       NOTIFICATION LIST (memo)                     */
    /* ------------------------------------------------------------------ */
    const notifications = useMemo(() => {
      const now = new Date();
      return healthRecords
        .filter((r) => r.nextDueDate && r.nextDueDate > now)
        .sort(
          (a, b) =>
            (a.nextDueDate?.getTime() ?? 0) -
            (b.nextDueDate?.getTime() ?? 0),
        )
        .slice(0, 5)
        .map((r) => {
          const goat = goats.find((g) => g.id === r.goatId);
          const days = Math.ceil(
            ((r.nextDueDate?.getTime() ?? 0) - now.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return {
            id: r.id,
            msg: `${goat?.tagNumber ?? 'Unknown'} – ${r.type} in ${days} day${
              days !== 1 ? 's' : ''
            }`,
            time: format(r.nextDueDate!, 'MMM dd, yyyy'),
            warn: days <= 3,
          };
        });
    }, [healthRecords, goats]);

    const closeAll = () => {
      setShowNotif(false);
      setShowProfile(false);
    };

    const handleSignOut = async () => {
      await signOut();
      closeAll();
    };

    /* ------------------------------------------------------------------ */
    /*                              VIEW                                  */
    /* ------------------------------------------------------------------ */
    return (
      <header className="relative z-30 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {/* ------------------- Top row ------------------- */}
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* Left  */}
          <div className="flex items-center gap-3">
            {/* —— Logo / title —— */}
            <span className="flex items-center gap-3">
              <span className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/20">
                <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </span>
              <span className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                  LivestockPro
                </h1>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {title}
                </p>
              </span>
            </span>
          </div>

          {/* Right  */}
          <div className="flex items-center gap-3">
            {/* -------- Notifications -------- */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotif((p) => !p);
                  setShowProfile(false);
                }}
                className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg z-30 dark:border-gray-700 dark:bg-gray-800">
                  <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                      Notifications
                    </h3>
                  </div>
                  <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                    {notifications.length ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/40"
                        >
                          <p
                            className={`${
                              n.warn
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            {n.msg}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {n.time}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No notifications
                      </p>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <p className="border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Based on upcoming health-record due dates
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* -------- Profile -------- */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfile((p) => !p);
                  setShowNotif(false);
                }}
                className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring dark:hover:bg-gray-800"
              >
                <span className="rounded-full bg-gray-100 p-1.5 dark:bg-gray-700/40">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </span>
                <span className="hidden sm:block text-left">
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-50">
                    {user?.email?.split('@')[0]}
                  </span>
                  <span className="block text-xs font-medium capitalize text-emerald-600 dark:text-emerald-400">
                    {userRole}
                  </span>
                </span>
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg z-30 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <span className="rounded-full bg-gray-100 p-2 dark:bg-gray-700/40">
                      <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
                        {user?.email}
                      </p>
                      <p className="text-xs font-medium capitalize text-emerald-600 dark:text-emerald-400">
                        {userRole}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- Business selector ---------------- */}
        <div className="border-t border-gray-200 py-2 dark:border-gray-700">
          <div className="mx-auto max-w-7xl px-4">
            <BusinessSelector onViewAllBusinesses={onViewAllBusinesses} />
          </div>
        </div>

        {/* Click-outside overlay */}
        {(showNotif || showProfile) && (
          <div
            className="fixed inset-0 z-20"
            onClick={closeAll}
            aria-hidden="true"
          />
        )}
      </header>
    );
  },
);

Header.displayName = 'Header';