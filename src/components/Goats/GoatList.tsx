/* ────────────────────────────────────────────────────────────────────────────
   src/components/Goats/GoatList.tsx
   Modern, mobile-first, polished Goat manager
──────────────────────────────────────────────────────────────────────────── */
import React, { useMemo, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import clsx from 'clsx';

import { GoatCard } from './GoatCard';
import { GoatModal } from './GoatModal';
import { GoatForm } from '../Forms/GoatForm';
import { SaleForm } from '../Forms/SaleForm';
import { BulkGoatImport } from '../Forms/BulkGoatImport';
import { LoadingSpinner } from '../UI/LoadingSpinner';

import { useApp } from '../../context/AppContext';
import { Goat } from '../../types';

/* ╭───────────────────────────────────────────────────────────────────────────╮
   │ Lightweight form-control helpers                                         │
   ╰───────────────────────────────────────────────────────────────────────────╯ */

const Input: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType }
> = ({ icon: Icon, className, ...props }) => (
  <label className="relative flex w-full">
    {/* left icon */}
    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
      <Icon className="h-5 w-5 text-neutral-400" />
    </span>

    <input
      {...props}
      className={clsx(
        'w-full rounded-lg border border-neutral-300 bg-white/60',
        'py-2 pl-10 pr-3 text-sm placeholder-neutral-400 shadow-sm',
        'transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500',
        'dark:border-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-100',
        className
      )}
    />
  </label>
);

const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: React.ElementType }
> = ({ icon: Icon, className, children, ...props }) => (
  <label className="relative flex w-full sm:w-auto">
    {Icon && (
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-neutral-400" />
      </span>
    )}

    <select
      {...props}
      className={clsx(
        'w-full appearance-none rounded-lg border border-neutral-300 bg-white/60',
        'py-2 pr-9 text-sm transition',
        Icon ? 'pl-10' : 'pl-3',
        'focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500',
        'dark:border-neutral-600 dark:bg-neutral-800/40 dark:text-neutral-100',
        className
      )}
    >
      {children}
    </select>

    {/* dropdown arrow */}
    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
      ▾
    </span>
  </label>
);

/* ╭───────────────────────────────────────────────────────────────────────────╮
   │ GoatList component                                                       │
   ╰───────────────────────────────────────────────────────────────────────────╯ */

export const GoatList: React.FC = () => {
  const { goats, caretakers, loading, error, updateGoat } = useApp();

  /* ── UI state ── */
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('All');
  const [keeper, setKeeper]   = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [selected,   setSelected]   = useState<Goat | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [editingGoat, setEditingGoat] = useState<Goat | null>(null);
  const [saleTarget, setSaleTarget] = useState<Goat | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);

  /* ── Helpers ── */
  const caretakerName = useCallback(
    (id?: string) =>
      id ? caretakers.find(c => c.id === id)?.name ?? 'Unknown' : 'Unassigned',
    [caretakers]
  );

  const markDeceased = async (g: Goat) => {
    if (
      window.confirm(
        `Mark ${g.tagNumber} (${g.nickname || 'Unnamed'}) as deceased?`
      )
    ) {
      try {
        await updateGoat(g.id, { status: 'Deceased' });
      } catch {
        alert('Failed to update goat.');
      }
    }
  };

  const handleEdit = (goat: Goat) => {
    setEditingGoat(goat);
    setShowForm(true);
    setShowModal(false); // Close the modal when opening edit form
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoat(null);
  };
  /* ── Derived data ── */
  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return goats.filter(g => {
      const matchesTxt =
        !s ||
        g.tagNumber.toLowerCase().includes(s) ||
        g.nickname?.toLowerCase().includes(s) ||
        g.breed.toLowerCase().includes(s);

      const matchesStatus = status === 'All' || g.status === status;
      const matchesKeeper =
        keeper === 'All' ||
        (keeper === 'Unassigned' && !g.caretakerId) ||
        g.caretakerId === keeper;

      return matchesTxt && matchesStatus && matchesKeeper;
    });
  }, [goats, search, status, keeper]);

  /* ── Early states ── */
  if (loading)
    return (
      <div className="flex h-72 w-full items-center justify-center">
        <LoadingSpinner label="Loading goats…" />
      </div>
    );

  if (error)
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
        Error: {error}
      </p>
    );

  /* ── Render ── */
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      {/* header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gradient">
            Goat Management
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Keep track of your herd with ease
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Bulk Import
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add goat
          </button>
        </div>
      </header>

      {/* filter bar */}
      <div className="rounded-lg border border-neutral-200 bg-white/60 p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800/40">
        {/* mobile toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex w-full items-center justify-between sm:hidden"
          aria-expanded={showFilters}
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <Filter className="h-5 w-5" />
            Filters
            {filtered.length !== goats.length && (
              <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-xs font-semibold text-white">
                {filtered.length}
              </span>
            )}
          </span>
          {showFilters ? (
            <ChevronUp className="h-5 w-5 text-neutral-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-neutral-500" />
          )}
        </button>

        <div
          className={clsx(
            'mt-4 flex flex-col gap-4 transition-all sm:mt-0 sm:flex-row sm:items-end',
            showFilters ? 'max-h-screen' : 'max-h-0 overflow-hidden sm:max-h-full'
          )}
        >
          <Input
            icon={Search}
            placeholder="Search by tag, nickname, breed…"
            type="search"
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            className="sm:flex-1"
          />

          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            icon={Filter}
            className="min-w-[9rem]"
          >
            {['All', 'Active', 'Sold', 'Deceased', 'Archived'].map(o => (
              <option key={o}>{o}</option>
            ))}
          </Select>

          <Select
            value={keeper}
            onChange={e => setKeeper(e.target.value)}
            icon={Users}
            className="min-w-[10rem]"
          >
            <option value="All">All caretakers</option>
            <option value="Unassigned">Unassigned</option>
            {caretakers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {/* desktop result counter */}
          <div className="hidden items-center gap-1 text-sm text-neutral-500 sm:flex">
            Showing
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {filtered.length}
            </span>
            of
            <span className="font-medium text-neutral-700 dark:text-neutral-200">
              {goats.length}
            </span>
          </div>
        </div>
      </div>

      {/* list or empty */}
      {filtered.length ? (
        <div
          className="grid gap-4 sm:gap-6
                     [grid-template-columns:repeat(auto-fill,minmax(15rem,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(16rem,1fr))]"
        >
          {filtered.map(g => (
            <GoatCard
              key={g.id}
              goat={g}
              caretakerName={caretakerName(g.caretakerId)}
              onViewDetails={() => {
                setSelected(g);
                setShowModal(true);
              }}
              onSellGoat={() => setSaleTarget(g)}
              onMarkDeceased={() => markDeceased(g)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Search className="h-12 w-12 text-neutral-400" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {goats.length
              ? 'No goats match your current filters.'
              : 'You haven’t added any goats yet.'}
          </p>

          {!goats.length && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium
                         text-white shadow transition hover:bg-emerald-700 focus:outline-none focus:ring-2
                         focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            >
              <Plus className="h-4 w-4" />
              Add your first goat
            </button>
          )}
        </div>
      )}

      {/* modals / forms */}
      <GoatModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        goat={selected}
        onEdit={handleEdit}
      />

      <GoatForm 
        isOpen={showForm} 
        onClose={handleCloseForm} 
        goat={editingGoat || undefined}
        isEdit={!!editingGoat}
      />

      <BulkGoatImport
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />
      {saleTarget && (
        <SaleForm
          isOpen={!!saleTarget}
          goat={saleTarget}
          onClose={() => setSaleTarget(null)}
        />
      )}
    </section>
  );
};