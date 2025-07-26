/* -----------------------------------------------------------------
   HealthRecords.tsx
   Track, filter and edit livestock health history.
------------------------------------------------------------------ */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  Heart,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

import { useApp } from '../../context/AppContext';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { HealthRecord } from '../../types';

/* ------------------------- helpers -------------------------- */

const typeEmoji: Record<string, string> = {
  Vaccination: '💉',
  Illness: '🤒',
  Injury: '🩹',
  Deworming: '💊',
  Checkup: '🔍',
  Reproductive: '🐣',
};

const statusColors: Record<
  string,
  { bg: string; text: string }
> = {
  Healthy: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'Under Treatment': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Recovered: { bg: 'bg-blue-100', text: 'text-blue-800' },
};

/* ----------------------- component -------------------------- */

export const HealthRecords: React.FC = () => {
  /* global data */
  const { healthRecords, goats, deleteHealthRecord, loading, error } =
    useApp(); // ensure `deleteHealthRecord` exists in context

  /* ui state */
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);

  /* derived */
  const filtered = useMemo(() => {
    return healthRecords
      .filter((r) =>
        filterType === 'All' ? true : r.type === filterType,
      )
      .filter((r) =>
        filterStatus === 'All' ? true : r.status === filterStatus,
      )
      .filter((r) =>
        search
          ? getGoatInfo(r.goatId).toLowerCase().includes(search.toLowerCase())
          : true,
      );
  }, [healthRecords, filterType, filterStatus, search]);

  const upcoming = useMemo(
    () =>
      healthRecords
        .filter(
          (r) => r.nextDueDate && r.nextDueDate > new Date(),
        )
        .sort(
          (a, b) =>
            (a.nextDueDate?.getTime() ?? 0) -
            (b.nextDueDate?.getTime() ?? 0),
        )
        .slice(0, 5),
    [healthRecords],
  );

  /* helpers */
  function getGoatInfo(goatId: string) {
    const g = goats.find((x) => x.id === goatId);
    return g ? `${g.tagNumber} - ${g.nickname ?? 'Unnamed'}` : 'Unknown';
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(rec: HealthRecord) {
    setEditing(rec);
    setFormOpen(true);
  }

  async function handleDelete(rec: HealthRecord) {
    if (
      window.confirm(
        `Delete ${rec.type} record for ${getGoatInfo(
          rec.goatId,
        )}? This cannot be undone.`,
      )
    )
      await deleteHealthRecord(rec.id);
  }

  /* render states */
  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <p className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error loading health records: {error}
      </p>
    );

  /* ---------------------- UI ----------------------- */
  return (
    <section className="space-y-8">
      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Health Records
          </h2>
          <p className="text-sm text-gray-600">
            Monitor treatments & wellbeing.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add record
        </button>
      </div>

      {/* upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 font-medium text-yellow-900">
            <AlertTriangle className="w-5 h-5" />
            Upcoming due dates
          </div>
          {upcoming.map((r) => (
            <div
              key={r.id}
              className="flex justify-between text-xs sm:text-sm"
            >
              <span className="text-yellow-800">
                {getGoatInfo(r.goatId)} – {r.type}
              </span>
              <span className="font-medium text-yellow-700">
                {r.nextDueDate && format(r.nextDueDate, 'MMM dd, yyyy')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Types</option>
            {[
              'Vaccination',
              'Illness',
              'Injury',
              'Deworming',
              'Checkup',
              'Reproductive',
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Status</option>
          <option>Healthy</option>
          <option>Under Treatment</option>
          <option>Recovered</option>
        </select>
        <input
          placeholder="Search goat..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* list */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <h3 className="px-6 py-4 border-b border-gray-200 font-semibold text-gray-900">
          Records
        </h3>

        {filtered.length ? (
          <ul className="divide-y divide-gray-200">
            {filtered.map((rec) => {
              const color = statusColors[rec.status] ?? statusColors.Healthy;
              return (
                <li
                  key={rec.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      {/* heading */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {typeEmoji[rec.type] ?? '📋'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {rec.type}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {getGoatInfo(rec.goatId)}
                          </p>
                        </div>
                      </div>

                      {/* description */}
                      {rec.description && (
                        <p className="text-gray-700 text-sm mb-2">
                          {rec.description}
                        </p>
                      )}

                      {/* meta grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(rec.date, 'MMM dd, yyyy')}
                        </div>
                        {rec.treatment && (
                          <div>
                            <strong>Treatment:</strong> {rec.treatment}
                          </div>
                        )}
                        {rec.veterinarian && (
                          <div>
                            <strong>Vet:</strong> {rec.veterinarian}
                          </div>
                        )}
                      </div>

                      {/* footer line */}
                      <div className="flex items-center justify-between mt-3 text-xs sm:text-sm">
                        <span className="font-medium text-gray-900">
                          Cost: ₹{rec.cost}
                        </span>
                        {rec.nextDueDate && (
                          <span className="text-yellow-700">
                            Next: {format(rec.nextDueDate, 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* right actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          color.bg,
                          color.text,
                        )}
                      >
                        {rec.status}
                      </span>
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEdit(rec)}
                          className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec)}
                          className="p-2 rounded-md hover:bg-red-50 text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <Heart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            No records match your filters.
          </div>
        )}
      </div>

      {/* modal / drawer form */}
      <HealthRecordForm
        isOpen={isFormOpen}
        onClose={() => setFormOpen(false)}
        record={editing ?? undefined}
        isEdit={!!editing}
      />
    </section>
  );
};