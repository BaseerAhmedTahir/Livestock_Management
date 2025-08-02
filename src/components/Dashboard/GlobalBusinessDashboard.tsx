// src/components/GlobalBusinessDashboard/GlobalBusinessDashboard.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowLeft
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Business } from '../../types';

/* -------------------------------------------------------------------------- */
/*                                Types / Utils                               */
/* -------------------------------------------------------------------------- */

type Summary = {
  business: Business;
  totalInvestment: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeGoats: number;
  soldGoats: number;
  totalGoats: number;
  caretakers: number;
};

interface Props {
  onSelectBusiness: (b: Business) => void;
  onBack: () => void;
}

const money = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(n);

/* -------------------------------------------------------------------------- */
/*                        Small reusable sub-components                       */
/* -------------------------------------------------------------------------- */

const StatCard: React.FC<{
  title: string;
  value: string | number;
  gradient: string;
  Icon: React.ElementType;
}> = ({ title, value, gradient, Icon }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}
  >
    <Icon className="absolute right-4 top-4 h-8 w-8 text-white/30 group-hover:rotate-6 transition-transform" />
    <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
      {title}
    </p>
    <p className="mt-1 text-2xl font-black">{value}</p>
  </div>
);

const Skeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 w-32 rounded bg-neutral-300/60 dark:bg-neutral-700" />
    <div className="h-56 rounded-xl bg-neutral-300/60 dark:bg-neutral-700" />
  </div>
);

/* -------------------------------------------------------------------------- */
/*                       <GlobalBusinessDashboard />                          */
/* -------------------------------------------------------------------------- */

export const GlobalBusinessDashboard: React.FC<Props> = ({
  onSelectBusiness,
  onBack
}) => {
  const { businesses, userRole } = useBusiness();
  const { user } = useAuth();

  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* --------------------------- Permissions guard ------------------------ */
  if (userRole !== 'owner') {
    return (
      <section className="flex flex-col items-center justify-center py-16 text-center">
        <span className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-700/40">
          <Building2 className="h-10 w-10 text-rose-600 dark:text-rose-300" />
        </span>
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Access denied
        </h2>
        <p className="mt-2 max-w-xs text-neutral-600 dark:text-neutral-400">
          Only business owners can open the global dashboard.
        </p>
      </section>
    );
  }

  /* ----------------------- Fetch summaries (parallel) ------------------- */
  useEffect(() => {
    if (!user || !businesses.length) return;

    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.all(
          businesses.map(async (business): Promise<Summary> => {
            // fetch data in parallel per business
            const [{ data: goats = [] }, { data: expenses = [] }, { data: health = [] }, { data: caretakers = [] }] =
              await Promise.all([
                supabase.from('goats').select('*').eq('business_id', business.id),
                supabase.from('expenses').select('*').eq('business_id', business.id),
                supabase
                  .from('health_records')
                  .select('*')
                  .eq('business_id', business.id),
                supabase
                  .from('caretakers')
                  .select('*')
                  .eq('business_id', business.id)
              ]).then(arr =>
                arr.map(res => {
                  if (res.error) throw res.error;
                  return res;
                })
              );

            // calculations
            const totalInvestment = goats.reduce(
              (s: number, g: any) => s + g.purchase_price,
              0
            );
            const totalRevenue = goats.reduce(
              (s: number, g: any) => s + (g.sale_price ?? 0),
              0
            );
            const totalExpenses =
              expenses.reduce((s: number, e: any) => s + e.amount, 0) +
              health.reduce((s: number, h: any) => s + h.cost, 0);
            const netProfit = totalRevenue - totalInvestment - totalExpenses;

            return {
              business,
              totalInvestment,
              totalRevenue,
              totalExpenses,
              netProfit,
              activeGoats: goats.filter((g: any) => g.status === 'Active').length,
              soldGoats: goats.filter((g: any) => g.status === 'Sold').length,
              totalGoats: goats.length,
              caretakers: caretakers.length
            };
          })
        );

        setSummaries(results);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : 'Unable to load business data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [businesses, user]);

  /* ---------------------------- Derived totals -------------------------- */
  const totals = useMemo(
    () =>
      summaries.reduce(
        (acc, s) => ({
          investment: acc.investment + s.totalInvestment,
          revenue: acc.revenue + s.totalRevenue,
          profit: acc.profit + s.netProfit,
          goats: acc.goats + s.totalGoats
        }),
        { investment: 0, revenue: 0, profit: 0, goats: 0 }
      ),
    [summaries]
  );

  /* ----------------------------- Chart data ----------------------------- */
  const barData = summaries.map(s => ({
    name:
      s.business.name.length > 14
        ? `${s.business.name.slice(0, 14)}…`
        : s.business.name,
    investment: s.totalInvestment,
    revenue: s.totalRevenue,
    profit: s.netProfit
  }));

  const pieData = summaries.map((s, i) => ({
    name: s.business.name,
    value: Math.max(0, s.netProfit),
    color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5]
  }));

  /* --------------------------- Render helpers --------------------------- */
  const Header = () => (
    <header className="mb-6 flex items-center gap-3">
      <button
        onClick={onBack}
        className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
      >
        <ArrowLeft className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
      </button>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          All Businesses Overview
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {loading
            ? 'Loading business summaries…'
            : `Summary across ${businesses.length} business${
                businesses.length > 1 ? 'es' : ''
              }`}
        </p>
      </div>
    </header>
  );

  /* ------------------------------ States -------------------------------- */
  if (loading)
    return (
      <section className="space-y-6">
        <Header />
        <Skeleton />
      </section>
    );

  if (error)
    return (
      <section className="space-y-6">
        <Header />
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-700 dark:bg-rose-900/40">
          {error}
        </div>
      </section>
    );

  /* ------------------------------- UI ----------------------------------- */
  return (
    <section className="space-y-8 pb-16">
      <Header />

      {/* Totals */}
      <div
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4
                   [grid-template-columns:repeat(auto-fill,minmax(13rem,1fr))]"
      >
        <StatCard
          title="Total Investment"
          value={money(totals.investment)}
          gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
          Icon={DollarSign}
        />
        <StatCard
          title="Total Revenue"
          value={money(totals.revenue)}
          gradient="bg-gradient-to-r from-blue-500 to-blue-600"
          Icon={TrendingUp}
        />
        <StatCard
          title="Net Profit"
          value={money(totals.profit)}
          gradient={
            totals.profit >= 0
              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
              : 'bg-gradient-to-r from-rose-500 to-rose-600'
          }
          Icon={totals.profit >= 0 ? TrendingUp : TrendingDown}
        />
        <StatCard
          title="Total Livestock"
          value={totals.goats}
          gradient="bg-gradient-to-r from-orange-500 to-orange-600"
          Icon={Users}
        />
      </div>

      {/* Business cards */}
      <div
        className="grid gap-6
                   sm:grid-cols-2 lg:grid-cols-3
                   [grid-template-columns:repeat(auto-fill,minmax(18rem,1fr))]"
      >
        {summaries.map(s => (
          <article
            key={s.business.id}
            className="rounded-2xl border border-neutral-200 bg-white/70 p-6 shadow-md
                       transition hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800/70"
          >
            <header className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3 truncate">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-700/40">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                </span>
                <div>
                  <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {s.business.name}
                  </h3>
                  {s.business.description && (
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {s.business.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onSelectBusiness(s.business)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-emerald-700"
              >
                <Eye className="h-4 w-4" />
                View
              </button>
            </header>

            {/* mini metrics */}
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Investment
                </dt>
                <dd className="font-semibold">{money(s.totalInvestment)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Revenue
                </dt>
                <dd className="font-semibold text-emerald-600">
                  {money(s.totalRevenue)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">
                  Net&nbsp;Profit
                </dt>
                <dd
                  className={`font-semibold ${
                    s.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {money(s.netProfit)}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500 dark:text-neutral-400">ROI</dt>
                <dd
                  className={`font-semibold ${
                    s.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {s.totalInvestment
                    ? ((s.netProfit / s.totalInvestment) * 100).toFixed(1)
                    : 0}
                  %
                </dd>
              </div>
            </dl>

            {/* goat / caretaker counts */}
            <div className="mt-4 grid grid-cols-3 border-t border-neutral-200 pt-4 text-center text-xs dark:border-neutral-700">
              <div>
                <p className="font-bold text-blue-600">{s.activeGoats}</p>
                <p className="text-neutral-500 dark:text-neutral-400">Active</p>
              </div>
              <div>
                <p className="font-bold text-purple-600">{s.soldGoats}</p>
                <p className="text-neutral-500 dark:text-neutral-400">Sold</p>
              </div>
              <div>
                <p className="font-bold text-orange-600">{s.caretakers}</p>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Caretakers
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Charts */}
      {summaries.length > 1 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* bar chart */}
          <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 shadow-md dark:border-neutral-700 dark:bg-neutral-800/70">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Business Performance Comparison
            </h3>
            <div className="h-80">
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(115,115,115,0.15)"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={v => `${Math.abs(v / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => money(v)}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend verticalAlign="top" height={30} />
                  <Bar dataKey="investment" fill="#8b5cf6" name="Investment" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="profit" fill="#f59e0b" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* pie chart */}
          <div className="rounded-2xl border border-neutral-200 bg-white/70 p-6 shadow-md dark:border-neutral-700 dark:bg-neutral-800/70">
            <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Profit Distribution
            </h3>
            <div className="h-80">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData.filter(p => p.value > 0)}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) =>
                      `${name} • ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((p, i) => (
                      <Cell key={i} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Detail table */}
      <div className="rounded-2xl border border-neutral-200 bg-white/70 shadow-md dark:border-neutral-700 dark:bg-neutral-800/70">
        <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Detailed Business Summary
          </h3>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60">
              <tr>
                {[
                  'Business',
                  'Investment',
                  'Net Profit',
                  'Active Goats',
                  'Sold Goats',
                  'Caretakers',
                  ''
                ].map(h => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {summaries.map(s => (
                <tr key={s.business.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="px-6 py-4">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {s.business.name}
                    </span>
                    {s.business.description && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {s.business.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">{money(s.totalInvestment)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={
                        s.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }
                    >
                      {money(s.netProfit)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{s.activeGoats}</td>
                  <td className="px-6 py-4">{s.soldGoats}</td>
                  <td className="px-6 py-4">{s.caretakers}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onSelectBusiness(s.business)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-neutral-50 font-semibold dark:bg-neutral-800/60">
                <td className="px-6 py-4">📊 Totals</td>
                <td className="px-6 py-4">{money(totals.investment)}</td>
                <td className="px-6 py-4">
                  <span
                    className={
                      totals.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }
                  >
                    {money(totals.profit)}
                  </span>
                </td>
                <td className="px-6 py-4">{totals.goats}</td>
                <td className="px-6 py-4" colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};