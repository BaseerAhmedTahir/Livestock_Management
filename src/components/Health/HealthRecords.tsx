// src/components/Health/HealthRecords.tsx
import React, { useMemo, useState } from 'react';
import {
  Plus,
  Filter,
  Calendar,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

const currency = (n: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0
  }).format(n);

const STATUS_COLORS: Record<string, string> = {
  Healthy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-700/30 dark:text-emerald-300',
  'Under Treatment':
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300',
  Recovered: 'bg-sky-100 text-sky-800 dark:bg-sky-700/30 dark:text-sky-300'
};

const TYPE_ICON = (t: string) =>
  ({
    Vaccination: '💉',
    Illness: '🤒',
    Injury: '🩹',
    Deworming: '💊',
    Checkup: '🔍',
    Reproductive: '🐣'
  }[t] ?? '📋');

/* -------------------------------------------------------------------------- */
/*                          Small sub components                              */
/* -------------------------------------------------------------------------- */

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[status] ?? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/30 dark:text-neutral-300'}`}
  >
    {status}
  </span>
);

const FilterSelect: React.FC<{
  icon?: React.ElementType;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}> = ({ icon: Icon, value, onChange, options, label }) => (
  <label className="flex items-center gap-2">
    {Icon && <Icon className="h-5 w-5 text-neutral-400" />}
    <span className="sr-only">{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="rounded-lg border border-neutral-300 bg-white dark:bg-neutral-800 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:text-neutral-100"
    >
      {options.map(o => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </label>
);

type RecordItemProps = {
  record: any;
  goatLabel: string;
};

const RecordItem: React.FC<RecordItemProps> = ({ record, goatLabel }) => (
  <li className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
    <div className="flex items-start justify-between gap-4 p-6">
      <div className="flex flex-1 flex-col gap-2">
        {/* top line */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">{TYPE_ICON(record.type)}</span>
          <div className="min-w-0">
            <h4 className="truncate font-medium text-neutral-900 dark:text-neutral-100">
              {record.type}
            </h4>
            <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
              {goatLabel}
            </p>
          </div>
        </div>

        {/* description */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {record.description}
        </p>

        {/* meta grid */}
        <div className="grid gap-4 text-xs text-neutral-600 dark:text-neutral-400 sm:grid-cols-3">
          <div className="flex items-center">
            <Calendar className="mr-1.5 h-4 w-4" />
            {format(record.date, 'MMM dd, yyyy')}
          </div>

          {record.treatment && (
            <div>
              <strong>Treatment:</strong> {record.treatment}
            </div>
          )}

          {record.veterinarian && (
            <div>
              <strong>Vet:</strong> {record.veterinarian}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Cost: {currency(record.cost)}
          </span>

          {record.nextDueDate && (
            <span className="text-sm text-yellow-600 dark:text-yellow-400">
              Next due: {format(record.nextDueDate, 'MMM dd, yyyy')}
            </span>
          )}
        </div>
      </div>

      {/* status */}
      <StatusBadge status={record.status} />
    </div>
  </li>
);

/* -------------------------------------------------------------------------- */
/*                            Main component                                  */
/* -------------------------------------------------------------------------- */

export const HealthRecords: React.FC = () => {
  const { healthRecords, goats, loading, error } = useApp();

  /* ----------------------------- Local state ---------------------------- */
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  /* ------------------------------ Filters ------------------------------- */
  const filtered = useMemo(
    () =>
      healthRecords.filter(r => {
        const typeOk = filterType === 'All' || r.type === filterType;
        const statusOk = filterStatus === 'All' || r.status === filterStatus;
        return typeOk && statusOk;
      }),
    [healthRecords, filterType, filterStatus]
  );

  const upcomingDue = useMemo(
    () =>
      healthRecords
        .filter(r => r.nextDueDate && r.nextDueDate > new Date())
        .sort(
          (a, b) =>
            (a.nextDueDate?.getTime() ?? 0) - (b.nextDueDate?.getTime() ?? 0)
        )
        .slice(0, 5),
    [healthRecords]
  );

  /* ----------------------------- Loading / Error ------------------------ */
  if (loading)
    return (
      <div className="flex h-80 w-full items-center justify-center">
        <LoadingSpinner label="Loading health records…" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
        Error loading health records: {error}
      </div>
    );

  const goatLabel = (id: string) => {
    const g = goats.find(g => g.id === id);
    return g ? `${g.tagNumber} – ${g.nickname || 'Unnamed'}` : 'Unknown Goat';
  };

  /* ------------------------------ Render -------------------------------- */
  return (
    <section className="space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">
            Health Records
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Monitor and track the health status of your livestock
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
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add record
          </button>
        </div>
      </header>

      {/* Upcoming due */}
      {upcomingDue.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/30">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
              Upcoming due dates
            </h3>
          </div>
          <ul className="space-y-1 text-sm">
            {upcomingDue.map(r => (
              <li key={r.id} className="flex justify-between">
                <span className="truncate text-yellow-800 dark:text-yellow-200">
                  {goatLabel(r.goatId)} • {r.type}
                </span>
                <span className="font-medium text-yellow-600 dark:text-yellow-300">
                  {format(r.nextDueDate!, 'MMM dd, yyyy')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <FilterSelect
          icon={Filter}
          label="Filter by type"
          value={filterType}
          onChange={setFilterType}
          options={[
            'All',
            'Vaccination',
            'Illness',
            'Injury',
            'Deworming',
            'Checkup',
            'Reproductive'
          ]}
        />
        <FilterSelect
          label="Filter by status"
          value={filterStatus}
          onChange={setFilterStatus}
          options={['All', 'Healthy', 'Under Treatment', 'Recovered']}
        />
      </div>

      {/* Records list */}
      <div className="rounded-2xl border border-neutral-200 bg-white/70 shadow-lg dark:border-neutral-700 dark:bg-neutral-800/70">
        <header className="border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </h2>
        </header>

        {filtered.length ? (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filtered.map(r => (
              <RecordItem key={r.id} record={r} goatLabel={goatLabel(r.goatId)} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Heart className="h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No health records match your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Modal form */}
      <HealthRecordForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </section>
  );
};