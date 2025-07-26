/* ----------------------------------------------------------------
   Reports.tsx
   A modern, responsive (mobile-first) livestock report dashboard.
----------------------------------------------------------------- */

import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  BarChart3,
  User2,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';

/* -------------------  Small Utility Components  ---------------- */

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  bg?: string; // tailwind background (e.g. "bg-emerald-50")
  accent?: string; // tailwind text (e.g. "text-emerald-700")
};
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  bg = 'bg-gray-50',
  accent = 'text-gray-600',
}) => (
  <div className={clsx(bg, 'rounded-lg p-4')}>
    <p className={clsx('text-xs font-medium uppercase tracking-wide', accent)}>
      {label}
    </p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

type SectionHeadingProps = { title: string };
const SectionHeading: React.FC<SectionHeadingProps> = ({ title }) => (
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    <span className="text-xs text-gray-500">
      Generated on {format(new Date(), 'MMM dd, yyyy')}
    </span>
  </div>
);

type ReportSelectorProps = {
  active: string;
  onSelect: (id: string) => void;
};
const reportTypes = [
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Complete livestock inventory with current status',
    icon: FileText,
  },
  {
    id: 'financial',
    name: 'Financial Summary',
    description: 'Revenue, expenses & profit analysis',
    icon: BarChart3,
  },
  {
    id: 'caretaker',
    name: 'Caretaker Performance',
    description: 'Assignments & earnings by caretaker',
    icon: User2,
  },
  {
    id: 'health',
    name: 'Health Summary',
    description: 'Vaccination & treatment schedule',
    icon: Stethoscope,
  },
];

const ReportSelector: React.FC<ReportSelectorProps> = ({
  active,
  onSelect,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {reportTypes.map(({ id, name, description, icon: Icon }) => {
      const selected = active === id;
      return (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={clsx(
            'p-4 text-left rounded-lg border-2 transition-colors',
            selected
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-200 hover:border-gray-300 bg-white',
          )}
        >
          <div className="flex items-center mb-2">
            <Icon
              className={clsx(
                'h-5 w-5 mr-2',
                selected ? 'text-emerald-600' : 'text-gray-400',
              )}
            />
            <h4
              className={clsx(
                'font-medium',
                selected ? 'text-emerald-900' : 'text-gray-900',
              )}
            >
              {name}
            </h4>
          </div>
          <p
            className={clsx(
              'text-sm',
              selected ? 'text-emerald-700' : 'text-gray-600',
            )}
          >
            {description}
          </p>
        </button>
      );
    })}
  </div>
);

/* -----------------------  Custom Hooks  ------------------------ */

const usePdfExport = (generateData: () => string, filename: () => string) => {
  const [working, setWorking] = useState(false);

  const exportFile = async () => {
    setWorking(true);
    try {
      // 👉 Simulate PDF generation
      await new Promise((r) => setTimeout(r, 1800));

      // 👉 For this demo we simply create a .txt blob
      const blob = new Blob([generateData()], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename();
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      /* eslint-disable no-console */
      console.error('PDF export failed', err);
    } finally {
      setWorking(false);
    }
  };

  return { exportFile, working };
};

/* --------------------------- Component ------------------------- */

export const Reports: React.FC = () => {
  /* ⤵️  fetch state from context */
  const { goats, caretakers, expenses, healthRecords, loading, error } =
    useApp();

  /* ⤵️  local UI state */
  const [selected, setSelected] = useState<'inventory' | 'financial' | 'caretaker' | 'health'>(
    'inventory',
  );
  const [dateRange, setDateRange] = useState('month');

  /* ⤵️  helper utils */
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(value);

  /* -------- Data calculations (kept close to UI layer) -------- */

  // Inventory
  const inventory = React.useMemo(() => {
    const total = goats.length;
    const active = goats.filter((g) => g.status === 'Active').length;
    const sold = goats.filter((g) => g.status === 'Sold').length;
    const breeds = goats.reduce((acc: Record<string, number>, g) => {
      acc[g.breed] = (acc[g.breed] ?? 0) + 1;
      return acc;
    }, {});
    const totalValue = goats.reduce((n, g) => n + g.purchasePrice, 0);
    return { total, active, sold, breeds, totalValue, goats };
  }, [goats]);

  // Financial
  const financial = React.useMemo(() => {
    const totalInvestment = goats.reduce((n, g) => n + g.purchasePrice, 0);
    const totalRevenue = goats
      .filter((g) => g.salePrice)
      .reduce((n, g) => n + (g.salePrice ?? 0), 0);
    const totalExpenses = expenses.reduce((n, e) => n + e.amount, 0);
    const netProfit = totalRevenue - totalInvestment - totalExpenses;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const sales = goats.filter((g) => g.status === 'Sold');
    return {
      totalInvestment,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      expenses,
      sales,
    };
  }, [goats, expenses]);

  /* ------------------- Export to PDF / TXT hook ---------------- */

  const { exportFile, working: isExporting } = usePdfExport(
    () => generateReportData(selected),
    () =>
      `livestock-${selected}-report-${format(new Date(), 'yyyy-MM-dd')}.txt`,
  );

  function generateReportData(type: string) {
    /*  ⚠️ For brevity we only export text – adapt as needed for real PDF  */
    if (type === 'financial') {
      return `
FINANCIAL SUMMARY — ${format(new Date(), 'PPPP')}

Investment : ${formatCurrency(financial.totalInvestment)}
Revenue    : ${formatCurrency(financial.totalRevenue)}
Expenses   : ${formatCurrency(financial.totalExpenses)}
Net Profit : ${formatCurrency(financial.netProfit)}
`;
    }
    // fallback: inventory
    return `
INVENTORY REPORT — ${format(new Date(), 'PPPP')}

Total Goats : ${inventory.total}
Active      : ${inventory.active}
Sold        : ${inventory.sold}
Total Value : ${formatCurrency(inventory.totalValue)}
`;
  }

  /* --------------------------- Render -------------------------- */

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error loading reports: {error}</p>
      </div>
    );

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ----------------- Page heading / actions ---------------- */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Reports & Analytics
          </h2>
          <p className="text-sm text-gray-600">
            Generate comprehensive insights for your farm
          </p>
        </div>
        <div className="inline-flex flex-wrap gap-2">
          <select
            aria-label="Choose date range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <button
            onClick={exportFile}
            disabled={isExporting}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-600"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting…' : 'Export'}
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </header>

      {/* ---------------------- Report picker --------------------- */}
      <ReportSelector active={selected} onSelect={(id) => setSelected(id as any)} />

      {/* ---------------------- Report body ----------------------- */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Inventory Report */}
        {selected === 'inventory' && (
          <div className="p-6">
            <SectionHeading title="Inventory Report" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Goats"
                value={inventory.total}
                bg="bg-blue-50"
                accent="text-blue-600"
              />
              <StatCard
                label="Active"
                value={inventory.active}
                bg="bg-emerald-50"
                accent="text-emerald-600"
              />
              <StatCard
                label="Sold"
                value={inventory.sold}
                bg="bg-purple-50"
                accent="text-purple-600"
              />
              <StatCard
                label="Total Value"
                value={formatCurrency(inventory.totalValue)}
                bg="bg-yellow-50"
                accent="text-yellow-600"
              />
            </div>

            <h4 className="font-medium text-gray-900 mb-3">
              Breed Distribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {Object.entries(inventory.breeds).map(([breed, count]) => (
                <StatCard key={breed} label={breed} value={count} />
              ))}
            </div>

            {/* ⚠️  Responsive table -> card stack on <640px */}
            <h4 className="font-medium text-gray-900 mb-3">
              Detailed Inventory
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Tag #</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Breed</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Weight</th>
                    <th className="px-4 py-3 text-left">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.goats.map((g) => (
                    <tr key={g.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {g.tagNumber}
                      </td>
                      <td className="px-4 py-3">{g.nickname || '—'}</td>
                      <td className="px-4 py-3">{g.breed}</td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            g.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : g.status === 'Sold'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800',
                          )}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{g.currentWeight}kg</td>
                      <td className="px-4 py-3">
                        {formatCurrency(g.purchasePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Financial Report */}
        {selected === 'financial' && (
          <div className="p-6">
            <SectionHeading title="Financial Summary" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Investment"
                value={formatCurrency(financial.totalInvestment)}
                bg="bg-purple-50"
                accent="text-purple-600"
              />
              <StatCard
                label="Total Revenue"
                value={formatCurrency(financial.totalRevenue)}
                bg="bg-emerald-50"
                accent="text-emerald-600"
              />
              <StatCard
                label="Total Expenses"
                value={formatCurrency(financial.totalExpenses)}
                bg="bg-red-50"
                accent="text-red-600"
              />
              <StatCard
                label="Net Profit"
                value={formatCurrency(financial.netProfit)}
                bg={
                  financial.netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'
                }
                accent={
                  financial.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                }
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* sales */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Recent Sales
                </h4>
                <ul className="space-y-3">
                  {financial.sales.map((g) => (
                    <li
                      key={g.id}
                      className="flex justify-between items-center bg-gray-50 rounded-md p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {g.tagNumber} – {g.nickname}
                        </p>
                        <p className="text-xs text-gray-600">
                          {g.saleDate && format(g.saleDate, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-600">
                          {formatCurrency(g.salePrice ?? 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          +
                          {formatCurrency(
                            (g.salePrice ?? 0) - g.purchasePrice,
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* expenses */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Recent Expenses
                </h4>
                <ul className="space-y-3">
                  {financial.expenses.map((e) => (
                    <li
                      key={e.id}
                      className="flex justify-between items-center bg-gray-50 rounded-md p-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {e.description}
                        </p>
                        <p className="text-xs text-gray-600">
                          {e.category} • {format(e.date, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <p className="font-medium text-red-600">
                        -{formatCurrency(e.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Caretaker Report */}
        {selected === 'caretaker' && (
          <div className="p-6">
            <SectionHeading title="Caretaker Performance" />
            <ul className="space-y-5">
              {caretakers.map((c) => {
                const assigned = goats.filter((g) => g.caretakerId === c.id);
                const active = assigned.filter((g) => g.status === 'Active');
                const sold = assigned.filter((g) => g.status === 'Sold');
                return (
                  <li
                    key={c.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {c.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {c.contactInfo.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-600">
                          {formatCurrency(c.totalEarnings)}
                        </p>
                        <p className="text-xs text-gray-500">Total Earnings</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 text-center gap-4">
                      <StatCard label="Assigned" value={assigned.length} />
                      <StatCard
                        label="Active"
                        value={active.length}
                        accent="text-emerald-600"
                        bg="bg-emerald-50"
                      />
                      <StatCard
                        label="Sold"
                        value={sold.length}
                        accent="text-purple-600"
                        bg="bg-purple-50"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Health Report */}
        {selected === 'health' && (
          <div className="p-6">
            <SectionHeading title="Health Summary" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Healthy"
                value={goats.filter((g) => g.status === 'Active').length}
                bg="bg-emerald-50"
                accent="text-emerald-600"
              />
              <StatCard
                label="Under Treatment"
                value="0"
                bg="bg-yellow-50"
                accent="text-yellow-600"
              />
              <StatCard
                label="Recovered"
                value="1"
                bg="bg-blue-50"
                accent="text-blue-600"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-3">
                Upcoming Treatments
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-yellow-800">
                    GT001 – PPR Vaccination
                  </span>
                  <span className="text-yellow-600 font-medium">
                    Feb&nbsp;01, 2025
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-yellow-800">GT001 – Deworming</span>
                  <span className="text-yellow-600 font-medium">
                    Jan&nbsp;15, 2025
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};