// src/components/Dashboard/GlobalBusinessDashboard.tsx
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Business } from '../../types';

interface BusinessSummary {
  business: Business;
  totalInvestment: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  activeGoats: number;
  soldGoats: number;
  totalGoats: number;
  caretakers: number;
}

interface Props {
  onSelectBusiness: (b: Business) => void;
  onBack: () => void;
}

export const GlobalBusinessDashboard: React.FC<Props> = memo(
  ({ onSelectBusiness, onBack }) => {
    /* ------------------------------------------------------------------ */
    /*                          STATE / CONTEXT                           */
    /* ------------------------------------------------------------------ */
    const { businesses, userRole } = useBusiness();
    const { user } = useAuth();

    const [summaries, setSummaries] = useState<BusinessSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /* ------------------------------------------------------------------ */
    /*                           AUTHORISATION                            */
    /* ------------------------------------------------------------------ */
    if (userRole !== 'owner') {
      return (
        <section className="mx-auto max-w-md px-4 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <Building2 className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Only business owners can access the global dashboard.
          </p>
        </section>
      );
    }

    /* ------------------------------------------------------------------ */
    /*                          DATA - FETCHING                           */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
      const fetchSummaries = async () => {
        if (!user || businesses.length === 0) return;

        setLoading(true);
        setError(null);

        try {
          const newSummaries: BusinessSummary[] = [];

          for (const business of businesses) {
            /* ---- Goats ---- */
            const { data: goats, error: goatsErr } = await supabase
              .from('goats')
              .select('*')
              .eq('business_id', business.id);
            if (goatsErr) throw goatsErr;

            /* ---- Expenses ---- */
            const { data: expenses, error: expErr } = await supabase
              .from('expenses')
              .select('*')
              .eq('business_id', business.id);
            if (expErr) throw expErr;

            /* ---- Health ---- */
            const { data: health, error: healthErr } = await supabase
              .from('health_records')
              .select('*')
              .eq('business_id', business.id);
            if (healthErr) throw healthErr;

            /* ---- Caretakers ---- */
            const { data: caretakers, error: carErr } = await supabase
              .from('caretakers')
              .select('*')
              .eq('business_id', business.id);
            if (carErr) throw carErr;

            /* ---- Metrics ---- */
            const totalInvestment = (goats ?? []).reduce(
              (s: number, g: any) => s + g.purchase_price,
              0,
            );
            const totalRevenue = (goats ?? [])
              .filter((g: any) => g.sale_price)
              .reduce((s: number, g: any) => s + g.sale_price, 0);
            const careExp = (expenses ?? []).reduce(
              (s: number, e: any) => s + e.amount,
              0,
            );
            const healthExp = (health ?? []).reduce(
              (s: number, h: any) => s + h.cost,
              0,
            );
            const totalExpenses = careExp + healthExp;
            const netProfit = totalRevenue - totalInvestment - totalExpenses;

            newSummaries.push({
              business,
              totalInvestment,
              totalRevenue,
              totalExpenses,
              netProfit,
              activeGoats: (goats ?? []).filter(
                (g: any) => g.status === 'Active',
              ).length,
              soldGoats: (goats ?? []).filter(
                (g: any) => g.status === 'Sold',
              ).length,
              totalGoats: goats?.length ?? 0,
              caretakers: caretakers?.length ?? 0,
            });
          }

          setSummaries(newSummaries);
        } catch (err) {
          console.error(err);
          setError(
            err instanceof Error ? err.message : 'Failed to load business data',
          );
        } finally {
          setLoading(false);
        }
      };

      fetchSummaries();
    }, [user, businesses]);

    /* ------------------------------------------------------------------ */
    /*                        DERIVED / MEMO VALUES                       */
    /* ------------------------------------------------------------------ */
    const globalTotals = useMemo(() => {
      return summaries.reduce(
        (t, s) => ({
          totalInvestment: t.totalInvestment + s.totalInvestment,
          totalRevenue: t.totalRevenue + s.totalRevenue,
          totalExpenses: t.totalExpenses + s.totalExpenses,
          netProfit: t.netProfit + s.netProfit,
          activeGoats: t.activeGoats + s.activeGoats,
          soldGoats: t.soldGoats + s.soldGoats,
          totalGoats: t.totalGoats + s.totalGoats,
          caretakers: t.caretakers + s.caretakers,
        }),
        {
          totalInvestment: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          activeGoats: 0,
          soldGoats: 0,
          totalGoats: 0,
          caretakers: 0,
        },
      );
    }, [summaries]);

    const currency = (n: number) =>
      new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
      }).format(n);

    const barData = useMemo(
      () =>
        summaries.map((s) => ({
          name:
            s.business.name.length > 15
              ? `${s.business.name.slice(0, 15)}…`
              : s.business.name,
          investment: s.totalInvestment,
          revenue: s.totalRevenue,
          profit: s.netProfit,
          goats: s.totalGoats,
        })),
      [summaries],
    );

    const pieData = useMemo(
      () =>
        summaries.map((s, i) => ({
          name: s.business.name,
          value: Math.max(0, s.netProfit),
          color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][i % 5],
        })),
      [summaries],
    );

    /* ------------------------------------------------------------------ */
    /*                             RENDER                                 */
    /* ------------------------------------------------------------------ */
    const Header = (
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50">
            All Businesses Overview
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {loading
              ? 'Loading business summaries…'
              : `Summary across ${businesses.length} businesses`}
          </p>
        </div>
      </header>
    );

    if (loading) {
      return (
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          {Header}
          <div className="flex justify-center py-12">
            <span className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600" />
          </div>
        </section>
      );
    }

    if (error) {
      return (
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          {Header}
          <div
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20"
          >
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Error: {error}
            </p>
          </div>
        </section>
      );
    }

    return (
      <section className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-6 lg:px-8">
        {Header}

        {/* -------- Global Totals -------- */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {/* total investment */}
          <StatCard
            title="Total Investment"
            value={currency(globalTotals.totalInvestment)}
            colorFrom="emerald-500"
            colorTo="emerald-600"
            Icon={DollarSign}
          />
          <StatCard
            title="Total Revenue"
            value={currency(globalTotals.totalRevenue)}
            colorFrom="blue-500"
            colorTo="blue-600"
            Icon={TrendingUp}
          />
          <StatCard
            title="Net Profit"
            value={currency(globalTotals.netProfit)}
            colorFrom="purple-500"
            colorTo="purple-600"
            Icon={TrendingUp}
          />
          <StatCard
            title="Total Livestock"
            value={globalTotals.totalGoats.toString()}
            colorFrom="orange-500"
            colorTo="orange-600"
            Icon={Users}
          />
        </div>

        {/* -------- Business Cards -------- */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((s) => (
            <article
              key={s.business.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
                    <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                      {s.business.name}
                    </h3>
                    {s.business.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {s.business.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectBusiness(s.business)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700 focus:outline-none focus:ring focus:ring-emerald-500/70"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
              </div>

              {/* mini stats */}
              <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                <MiniStat label="Investment" value={currency(s.totalInvestment)} />
                <MiniStat
                  label="Revenue"
                  value={currency(s.totalRevenue)}
                  positive
                />
                <MiniStat
                  label="Net Profit"
                  value={currency(s.netProfit)}
                  positive={s.netProfit >= 0}
                />
                <MiniStat
                  label="ROI"
                  value={
                    s.totalInvestment
                      ? `${((s.netProfit / s.totalInvestment) * 100).toFixed(1)}%`
                      : '0%'
                  }
                  positive={s.netProfit >= 0}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <TinyCount label="Active" value={s.activeGoats} color="blue" />
                <TinyCount label="Sold" value={s.soldGoats} color="purple" />
                <TinyCount label="Caretakers" value={s.caretakers} color="orange" />
              </div>
            </article>
          ))}
        </div>

        {/* -------- Charts -------- */}
        {summaries.length > 1 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* bar chart */}
            <ChartCard title="Business Performance Comparison">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(v) => `₨${v / 1000}k`}
                  />
                  <Tooltip
                    formatter={(v: number) => currency(v)}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="investment" fill="#8b5cf6" name="Investment" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar dataKey="profit" fill="#f59e0b" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* pie chart */}
            <ChartCard title="Profit Distribution">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.filter((p) => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {pieData.map((p, i) => (
                      <Cell key={i} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => currency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* -------- Summary Table -------- */}
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Detailed Business Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/40">
                <tr>
                  {[
                    'Business',
                    'Investment',
                    'Profit',
                    'Active',
                    'Sold',
                    'Caretakers',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {summaries.map((s) => (
                  <tr
                    key={s.business.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {s.business.name}
                      {s.business.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {s.business.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {currency(s.totalInvestment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          s.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }
                      >
                        {currency(s.netProfit)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.activeGoats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.soldGoats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {s.caretakers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        type="button"
                        onClick={() => onSelectBusiness(s.business)}
                        className="text-emerald-600 hover:text-emerald-800 dark:hover:text-emerald-400"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {/* totals row */}
                <tr className="bg-gray-50 font-semibold dark:bg-gray-800/40">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    📊 Totals ({businesses.length})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {currency(globalTotals.totalInvestment)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={
                        globalTotals.netProfit >= 0
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }
                    >
                      {currency(globalTotals.netProfit)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {globalTotals.activeGoats}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {globalTotals.soldGoats}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {globalTotals.caretakers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  },
);

GlobalBusinessDashboard.displayName = 'GlobalBusinessDashboard';

/* ------------------------------------------------------------------ */
/*                         SMALL PRESENTATIONALS                       */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string;
  colorFrom: string;
  colorTo: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  colorFrom,
  colorTo,
  Icon,
}) => (
  <div
    className={`rounded-lg bg-gradient-to-r from-${colorFrom} to-${colorTo} p-5 text-white shadow-sm`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide opacity-75">{title}</p>
        <p className="mt-1 text-xl font-bold">{value}</p>
      </div>
      <Icon className="h-8 w-8 opacity-80" />
    </div>
  </div>
);

const MiniStat: React.FC<{
  label: string;
  value: string;
  positive?: boolean;
}> = ({ label, value, positive }) => (
  <div>
    <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
    <p
      className={`font-semibold ${
        positive == null
          ? 'text-gray-900 dark:text-gray-50'
          : positive
          ? 'text-emerald-600'
          : 'text-red-600'
      }`}
    >
      {value}
    </p>
  </div>
);

const TinyCount: React.FC<{
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'orange';
}> = ({ label, value, color }) => (
  <div className="text-center">
    <p className={`text-lg font-bold text-${color}-600`}>{value}</p>
    <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
  </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="h-96 overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
      {title}
    </h3>
    <div className="h-[calc(100%-2rem)]">{children}</div>
  </div>
);