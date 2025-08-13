/* -------------------------------------------------------------------------- */
/*  FinanceManagement.tsx                                                     */
/* -------------------------------------------------------------------------- */
import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Edit,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
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

import { TransactionForm } from '../Forms/TransactionForm';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';

/* -------------------------------------------------------------------------- */
/*  Helper components                                                          */
/* -------------------------------------------------------------------------- */
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  cta?: () => void;
  ctaLabel?: string;
}> = ({ icon, title, cta, ctaLabel }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center space-y-4">
    <div className="opacity-40">{icon}</div>
    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    {cta && ctaLabel && (
      <button
        onClick={cta}
        className="text-emerald-600 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 rounded"
      >
        {ctaLabel}
      </button>
    )}
  </div>
);

/* Metric card */
const StatCard: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
  positive?: boolean;
}> = ({ label, value, icon, positive = true }) => (
  <div className="bg-white dark:bg-neutral-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-neutral-700 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">
          {label}
        </p>
        <p
          className={`text-xl font-bold sm:text-2xl ${
            positive ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {value}
        </p>
      </div>
      <div
        className={`p-3 rounded-full ${
          positive ? 'bg-emerald-100' : 'bg-red-100'
        } dark:bg-opacity-10`}
      >
        {icon}
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */
export const FinanceManagement: React.FC = () => {
  const { goats, expenses, caretakers, healthRecords, deleteExpense } = useApp();
  const { activeBusiness } = useBusiness();

  /* ---------------------------- component state --------------------------- */
  const [activeTab, setActiveTab] = useState<'overview' | 'profit' | 'txn' | 'exp' | 'care'>(
    'overview'
  );
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<typeof expenses[0] | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /* -------------------------- helper / formatting ------------------------- */
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);

  /* ------------------------------ calculations ---------------------------- */
  const metrics = useMemo(() => {
    const totalInvestment = goats.reduce((s, g) => s + g.purchasePrice, 0);
    const totalRevenue = goats.reduce((s, g) => s + (g.salePrice || 0), 0);
    const farmExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const medical = healthRecords.reduce((s, h) => s + h.cost, 0);
    const totalExpenses = farmExpenses + medical;
    const netProfit = totalRevenue - (totalInvestment + totalExpenses);

    return {
      totalInvestment,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue ? (netProfit / totalRevenue) * 100 : 0,
      roi: totalInvestment ? (netProfit / totalInvestment) * 100 : 0,
    };
  }, [goats, expenses, healthRecords]);

  const soldGoats = useMemo(() => goats.filter((g) => g.status === 'Sold'), [goats]);

  /* profit per goat (incl. shared costs) */
  const goatProfit = (goat: Goat) => {
    if (!goat.salePrice) return 0;

    const specific = expenses
      .filter((e) => e.goatId === goat.id)
      .reduce((s, e) => s + e.amount, 0);

    const shared = expenses
      .filter((e) => !e.goatId)
      .reduce((s, e) => s + e.amount, 0);

    const activeGoats = goats.filter((g) => g.status === 'Active').length || 1;
    const sharedPerGoat = shared / activeGoats;

    const health = healthRecords
      .filter((h) => h.goatId === goat.id)
      .reduce((s, h) => s + h.cost, 0);

    return goat.salePrice - goat.purchasePrice - (specific + sharedPerGoat + health);
  };

  const avgProfit = useMemo(
    () => (soldGoats.length ? soldGoats.reduce((s, g) => s + goatProfit(g), 0) / soldGoats.length : 0),
    [soldGoats, expenses, healthRecords]
  );

  /* caretaker earnings ------------------------------------------------------ */
  const caretakerEarnings = useMemo(() => {
    if (!activeBusiness) return [];
    return caretakers.map((c) => {
      const managed = soldGoats.filter((g) => g.caretakerId === c.id);
      let earnings = 0;

      managed.forEach((g) => {
        const profit = goatProfit(g);
        if (activeBusiness.paymentModelType === 'percentage') {
          earnings += (profit * activeBusiness.paymentModelAmount) / 100;
        } else if (g.saleDate && g.purchaseDate) {
          const months = Math.max(
            1,
            Math.floor(
              (g.saleDate.getTime() - g.purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
            )
          );
          earnings += months * activeBusiness.paymentModelAmount;
        }
      });

      return { ...c, goatsManaged: managed.length, earnings };
    });
  }, [caretakers, soldGoats, activeBusiness]);

  const handleEditExpense = (expense: typeof expenses[0]) => {
    setEditingExpense(expense);
    setIsEditMode(true);
    setFormOpen(true);
  };

  const handleDeleteExpense = async (expense: typeof expenses[0]) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this expense?\n\n` +
      `${expense.description} - ₹${expense.amount.toLocaleString()}\n` +
      `Date: ${format(expense.date, 'MMM dd, yyyy')}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await deleteExpense(expense.id);
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingExpense(null);
    setIsEditMode(false);
  };

  /* expense breakdown ------------------------------------------------------- */
  const expenseData = useMemo(() => {
    const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    const palette: Record<string, string> = {
      Feed: '#10b981',
      Medicine: '#f59e0b',
      Transport: '#3b82f6',
      Veterinary: '#ef4444',
    };
    return Object.entries(byCategory).map(([category, amount]) => ({
      category,
      amount,
      color: palette[category] ?? '#8b5cf6',
    }));
  }, [expenses]);

  /* monthly chart data ------------------------------------------------------ */
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [...Array(12)].map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - idx), 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const revenue = goats
        .filter((g) => g.saleDate && g.saleDate >= start && g.saleDate <= end)
        .reduce((s, g) => s + (g.salePrice || 0), 0);

      const monthExpenses =
        expenses
          .filter((e) => e.date >= start && e.date <= end)
          .reduce((s, e) => s + e.amount, 0) +
        healthRecords
          .filter((h) => h.date >= start && h.date <= end)
          .reduce((s, h) => s + h.cost, 0);

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        expenses: monthExpenses,
        profit: revenue - monthExpenses,
      };
    });

    return months.filter((m) => m.revenue || m.expenses);
  }, [goats, expenses, healthRecords]);

  /* ------------------------------------------------------------------------ */
  /*  Memoized charts                                                         */
  /* ------------------------------------------------------------------------ */
  const MonthlyChart = React.memo(() =>
    monthlyData.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyData} barGap={0} barCategoryGap="10%">
          <CartesianGrid strokeDasharray="4 4" stroke="#f0f0f0" horizontal vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              `PKR ${v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}k`}`
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: '0.5rem',
              borderColor: '#e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
            formatter={(v: number) => [formatCurrency(v), '']}
            labelStyle={{ color: '#1f2937' }}
          />
          <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <EmptyState
        icon={<TrendingUp className="h-10 w-10" />}
        title="No monthly data yet."
        cta={() => setFormOpen(true)}
        ctaLabel="Add first transaction"
      />
    )
  );

  const ExpenseChart = React.memo(() =>
    expenseData.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="amount"
            label={(d) => `${d.category} (${((d.percent ?? 0) * 100).toFixed(0)}%)`}
          >
            {expenseData.map((e, i) => (
              <Cell key={i} fill={e.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatCurrency(v as number)} />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <EmptyState
        icon={<TrendingDown className="h-10 w-10" />}
        title="No expenses recorded yet."
        cta={() => setFormOpen(true)}
        ctaLabel="Add expense"
      />
    )
  );

  /* ------------------------------------------------------------------------ */
  /*  Tabs                                                                    */
  /* ------------------------------------------------------------------------ */
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'profit', label: 'Profit Analysis' },
    { id: 'txn', label: 'Transactions' },
    { id: 'exp', label: 'Expenses' },
    { id: 'care', label: 'Caretaker Earnings' },
  ] as const;

  /* ------------------------------------------------------------------------ */
  /*  JSX                                                                     */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gradient">
            Financial Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Track investments, expenses and profitability
          </p>
        </div>

        <div className="flex gap-2">
          {/* <button
            onClick={refreshData}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button> */}
          <button
            onClick={() => setFormOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Investment"
          value={formatCurrency(metrics.totalInvestment)}
          icon={<DollarSign className="h-6 w-6 text-purple-600" />}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(metrics.totalExpenses)}
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
          positive={false}
        />
        <StatCard
          label="Net Profit"
          value={formatCurrency(metrics.netProfit)}
          icon={
            metrics.netProfit >= 0 ? (
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-red-600" />
            )
          }
          positive={metrics.netProfit >= 0}
        />
      </div>

      {/* tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <nav className="flex space-x-8 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === t.id
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ------------------------------ tab panels --------------------------- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* monthly chart */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">
              Monthly Performance
            </h3>
            <div className="h-80">
              <MonthlyChart />
            </div>
          </div>

          {/* expense pie */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">
              Expense Breakdown
            </h3>
            <div className="h-80">
              <ExpenseChart />
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------- profit ---------------------------- */}
      {activeTab === 'profit' && (
        <div className="space-y-6">
          {/* top stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Average Profit / Goat"
              value={formatCurrency(avgProfit)}
              icon={<TrendingUp className="h-6 w-6 text-emerald-600" />}
              positive={avgProfit >= 0}
            />
            <StatCard
              label="Profit Margin"
              value={`${metrics.profitMargin.toFixed(1)}%`}
              icon={<TrendingUp className="h-6 w-6 text-blue-600" />}
              positive={metrics.profitMargin >= 0}
            />
            <StatCard
              label="ROI"
              value={`${metrics.roi.toFixed(1)}%`}
              icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
              positive={metrics.roi >= 0}
            />
            <StatCard
              label="Goats Sold"
              value={soldGoats.length.toString()}
              icon={<DollarSign className="h-6 w-6 text-gray-600" />}
            />
          </div>

          {/* per-goat list */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
                Detailed Profit Analysis
              </h3>
            </div>

            {soldGoats.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="h-10 w-10" />}
                title="No goats sold yet."
                cta={() => setFormOpen(true)}
                ctaLabel="Record a sale"
              />
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {soldGoats.map((g) => {
                  const profit = goatProfit(g);
                  const profitPct = g.purchasePrice
                    ? (profit / g.purchasePrice) * 100
                    : 0;
                  return (
                    <div key={g.id} className="p-4 sm:p-6 space-y-3">
                      {/* top row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 min-w-0">
                          <img
                            src={
                              g.photos?.[0] ??
                              'https://images.pexels.com/photos/2647053/pexels-photo-2647053.jpeg'
                            }
                            alt={g.tagNumber}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {g.tagNumber} – {g.nickname || 'Unnamed'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {g.breed} • {g.gender}
                            </p>
                            {g.saleDate && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {format(g.saleDate, 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <p
                            className={`text-lg font-bold ${
                              profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(profit)}
                          </p>
                          <p
                            className={`text-xs ${
                              profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {profitPct.toFixed(1)}% ROI
                          </p>
                        </div>
                      </div>

                      {/* metrics grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-neutral-400">Sale Price</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(g.salePrice || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-neutral-400">Purchase Price</p>
                          <p className="font-semibold text-gray-900 dark:text-neutral-100">
                            {formatCurrency(g.purchasePrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-neutral-400">Expenses</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(
                              expenses
                                .filter((e) => e.goatId === g.id)
                                .reduce((s, e) => s + e.amount, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-neutral-400">Health Costs</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(
                              healthRecords
                                .filter((h) => h.goatId === g.id)
                                .reduce((s, h) => s + h.cost, 0)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------- txn list --------------------------- */}
      {activeTab === 'txn' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              Recent Transactions
            </h3>
          </div>

          {soldGoats.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="h-10 w-10" />}
              title="No transactions yet."
              cta={() => setFormOpen(true)}
              ctaLabel="Add transaction"
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {soldGoats.map((g) => (
                <div key={g.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        Sale – {g.tagNumber} {g.nickname && `(${g.nickname})`}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {g.breed} • {g.gender}
                      </p>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {g.saleDate && format(g.saleDate, 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(g.salePrice || 0)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400">
                        Net&nbsp;{formatCurrency(goatProfit(g))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------- expenses --------------------------- */}
      {activeTab === 'exp' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              Expense Records
            </h3>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={<TrendingDown className="h-10 w-10" />}
              title="No expenses recorded."
              cta={() => setFormOpen(true)}
              ctaLabel="Add expense"
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((e) => {
                const goat = e.goatId ? goats.find((g) => g.id === e.goatId) : null;
                return (
                  <div key={e.id} className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {e.description}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        Category&nbsp;•&nbsp;{e.category}
                      </p>
                      {goat && (
                        <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">
                          Goat:&nbsp;{goat.tagNumber}
                        </p>
                      )}
                      <div className="flex items-center text-xs text-gray-500 dark:text-neutral-400">
                        <Calendar className="h-3.5 w-3.5 mr-1" />
                        {format(e.date, 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right whitespace-nowrap">
                      <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                        -{formatCurrency(e.amount)}
                      </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditExpense(e)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit expense"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(e)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------- caretaker earnings ---------------------- */}
      {activeTab === 'care' && (
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
              Caretaker Earnings
            </h3>
          </div>

          {caretakerEarnings.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="h-10 w-10" />}
              title="No caretakers found."
            />
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {caretakerEarnings.map((c) => (
                <div key={c.id} className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-neutral-100">
                        {c.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {c.contactInfo?.phone}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                        {activeBusiness?.paymentModelType === 'percentage'
                          ? `Profit share: ${activeBusiness.paymentModelAmount}%`
                          : `Monthly: ${formatCurrency(activeBusiness?.paymentModelAmount ?? 0)}`}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.earnings)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-neutral-400">
                        {c.goatsManaged} goats sold
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center text-xs sm:text-sm">
                    <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-3">
                      <p className="font-semibold text-gray-900 dark:text-neutral-100">
                        {c.assignedGoats?.length ?? 0}
                      </p>
                      <p className="text-gray-600 dark:text-neutral-400">Assigned</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">{c.goatsManaged}</p>
                      <p className="text-gray-600 dark:text-neutral-400">Sold</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {c.goatsManaged
                          ? formatCurrency(c.earnings / c.goatsManaged)
                          : formatCurrency(0)}
                      </p>
                      <p className="text-gray-600 dark:text-neutral-400">
                        Avg / Goat
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* transaction modal */}
      <TransactionForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm}
        expense={editingExpense || undefined}
        isEdit={isEditMode}
      />
    </div>
  );
};
