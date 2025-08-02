/* ────────────────────────────────────────────────────────────────────────────
   src/components/Goats/CaretakerManagement.tsx
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useState, useMemo } from 'react';
import clsx from 'clsx';
import {
  Plus,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Users,
  Edit,
  Trash2,
  UserPlus,
  Key,
  CheckCircle,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../lib/supabase';

import { CaretakerForm } from '../Forms/CaretakerForm';
import { CaretakerInviteModal } from './CaretakerInviteModal';

import { Caretaker, UserBusinessRole } from '../../types';

/* ╭───────────────────────────────────────────────────────────────────────────╮
   │ Re-usable tiny helpers                                                   │
   ╰───────────────────────────────────────────────────────────────────────────╯ */
const StatCard: React.FC<{
  value: string | number;
  label: string;
  icon: React.ElementType;
  gradient: string;
  text: string;
}> = ({ value, label, icon: Icon, gradient, text }) => (
  <div className="card">
    <div className="card-body">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {label}
          </p>
          <p className={clsx('mt-1 text-3xl font-bold', text)}>{value}</p>
        </div>
        <div
          className={clsx(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            gradient
          )}
        >
          <Icon className={clsx('h-6 w-6', text)} />
        </div>
      </div>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    Active:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-700/40 dark:text-emerald-300',
    Sold: 'bg-sky-100 text-sky-800 dark:bg-sky-700/40 dark:text-sky-300',
    Deceased:
      'bg-rose-100 text-rose-800 dark:bg-rose-700/40 dark:text-rose-300'
  };
  return (
    <span
      className={clsx(
        'rounded-full px-2 py-0.5 text-xs font-semibold',
        map[status] ??
          'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/40 dark:text-neutral-300'
      )}
    >
      {status}
    </span>
  );
};

const SkeletonCircle: React.FC = () => (
  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary-600" />
);

/* ╭───────────────────────────────────────────────────────────────────────────╮
   │ Main component                                                           │
   ╰───────────────────────────────────────────────────────────────────────────╯ */

export const CaretakerManagement: React.FC = () => {
  /* context + hooks */
  const {
    caretakers,
    goats,
    deleteCaretaker,
    expenses,
    healthRecords,
  } = useApp();
  const { user } = useAuth(); // (kept for potential future use)
  const {
    activeBusiness,
    updateCaretakerBusinessRolePermissions
  } = useBusiness();

  /* UI state */
  const [selectedId, setSelectedId] = useState(caretakers[0]?.id || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editing, setEditing] = useState<Caretaker | null>(null);
  const [inviting, setInviting] = useState<Caretaker | null>(null);

  const [role, setRole] = useState<UserBusinessRole | null>(null);
  const [loadingPerms, setLoadingPerms] = useState(false);

  /* NEW: collapse / expand state for Permissions card */
  const [showPerms, setShowPerms] = useState(true);

  /* derived – selected caretaker & goats */
  const selected = caretakers.find(c => c.id === selectedId);
  const assigned = goats.filter(g => g.caretakerId === selected?.id);
  const activeGoats = assigned.filter(g => g.status === 'Active');
  const soldGoats = assigned.filter(g => g.status === 'Sold');

  /* quick earnings calculation */
  const earnings = useMemo(() => {
    if (!selected || !activeBusiness) return 0;

    return assigned
      .filter(g => g.status === 'Sold' && g.salePrice)
      .reduce((tot, goat) => {
        // goat specific, shared & health expenses
        const specific = expenses
          .filter(e => e.goatId === goat.id)
          .reduce((s, e) => s + e.amount, 0);

        const sharedTotal = expenses
          .filter(e => !e.goatId)
          .reduce((s, e) => s + e.amount, 0);

        const sharedPer =
          sharedTotal / (goats.filter(g => g.status === 'Active').length || 1);

        const health = healthRecords
          .filter(h => h.goatId === goat.id)
          .reduce((s, h) => s + h.cost, 0);

        const netProfit =
          (goat.salePrice ?? 0) -
          goat.purchasePrice -
          (specific + sharedPer + health);

        // payment models
        if (activeBusiness.paymentModelType === 'percentage')
          return tot + (netProfit * activeBusiness.paymentModelAmount) / 100;

        if (goat.saleDate && goat.purchaseDate) {
          const months = Math.max(
            1,
            Math.floor(
              (goat.saleDate.getTime() - goat.purchaseDate.getTime()) /
                (1000 * 60 * 60 * 24 * 30)
            )
          );
          return tot + activeBusiness.paymentModelAmount * months;
        }
        return tot;
      }, 0);
  }, [assigned, activeBusiness, expenses, goats, healthRecords, selected]);

  /* default permissions (owner gets full) */
  const defaultPerms: Record<string, boolean> = {
    dashboard: true,
    goats: true,
    health: true,
    scanner: true,
    settings: true,
    caretakers: false,
    finances: false,
    reports: false
  };

  const tabs = [
    { id: 'dashboard',  name: 'Dashboard',        desc: 'View stats & overview' },
    { id: 'goats',      name: 'Goat Management',  desc: 'Manage goats' },
    { id: 'health',     name: 'Health Records',   desc: 'Add & view health data' },
    { id: 'scanner',    name: 'QR Scanner',       desc: 'Scan goat QR codes' },
    { id: 'settings',   name: 'Settings',         desc: 'Account & preferences' },
    { id: 'caretakers', name: 'Caretakers',       desc: 'Manage staff (owner)' },
    { id: 'finances',   name: 'Finances',         desc: 'View business finances' },
    { id: 'reports',    name: 'Reports',          desc: 'Generate reports' }
  ];

  /* fetch role / permissions whenever selection changes */
  useEffect(() => {
    const fetchRole = async () => {
      if (!selected?.contactInfo.email || !activeBusiness) {
        setRole(null);
        return;
      }
      setLoadingPerms(true);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const { data, error } = await supabase.functions.invoke(
          'get-user-by-email',
          {
            body: {
              email: selected.contactInfo.email,
              businessId: activeBusiness.id
            },
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        );

        if (error || !data?.success) {
          setRole(null);
        } else {
          const r = data.userBusinessRole;
          setRole({
            id: r.id,
            userId: r.user_id,
            businessId: r.business_id,
            role: r.role,
            linkedCaretakerId: r.linked_caretaker_id || undefined,
            createdAt: new Date(r.created_at),
            permissions: r.permissions ?? defaultPerms
          });
        }
      } catch (err) {
        console.error(err);
        setRole(null);
      } finally {
        setLoadingPerms(false);
      }
    };
    fetchRole();
  }, [selected, activeBusiness]);

  /* toggle a permission on / off */
  const togglePerm = async (tab: string, enabled: boolean) => {
    if (!role) return;
    const updated = { ...role.permissions, [tab]: enabled };
    setRole(prev => (prev ? { ...prev, permissions: updated } : prev));
    await updateCaretakerBusinessRolePermissions(role.id, updated);
  };

  /* delete caretaker helper */
  const handleDelete = async (c: Caretaker) => {
    const count = goats.filter(g => g.caretakerId === c.id).length;
    const confirm = window.confirm(
      count
        ? `${c.name} has ${count} assigned goats. Deleting will unassign them. Continue?`
        : `Delete ${c.name}?`
    );
    if (!confirm) return;
    await deleteCaretaker(c.id);
    setSelectedId(prev => (prev === c.id ? caretakers[0]?.id || '' : prev));
  };

  /* empty-state shortcut */
  if (!caretakers.length)
    return (
      <div className="space-y-6 px-4">
        {/* header */}
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gradient">
              Caretaker Management
            </h2>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              Manage caretakers and their livestock
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* <button
              onClick={refreshData}
              className="btn-outline flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button> */}
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center"
            >
              <Plus className="h-5 w-5" />
              Add caretaker
            </button>
          </div>
        </header>

        <div className="card">
          <div className="card-body text-center py-16">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-medium">
              <Users className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              No caretakers yet
            </h3>
            <p className="mx-auto mb-8 max-w-md text-neutral-600 dark:text-neutral-400">
              Add caretakers, assign goats, track performance and earnings.
            </p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add your first caretaker
            </button>
          </div>
        </div>

        {/* modal / form */}
        <CaretakerForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
        />
      </div>
    );

  /* ──────────────────────────── MAIN RENDER ─────────────────────────────── */
  return (
    <div className="space-y-6 px-4">
      {/* header */}
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient">
            Caretaker Management
          </h2>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage caretakers and their assigned livestock
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* <button
            onClick={refreshData}
            className="btn-outline flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button> */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
            <Plus className="h-5 w-5" />
            Add caretaker
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ──────── Caretaker list / drawer ──────── */}
        <aside className="card lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="card-header sticky top-0 z-10 bg-white/90 backdrop-blur dark:bg-neutral-800/90">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100">
              Caretakers
            </h3>
            <p className="mt-0.5 text-sm text-neutral-600 dark:text-neutral-400">
              {caretakers.length} total
            </p>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {caretakers.map(ct => {
              const ctGoats = goats.filter(g => g.caretakerId === ct.id);
              const activeCount = ctGoats.filter(g => g.status === 'Active')
                .length;
              const account = ct.loginCredentials?.hasAccount;

              return (
                <button
                  key={ct.id}
                  onClick={() => setSelectedId(ct.id)}
                  className={clsx(
                    'flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/40',
                    selectedId === ct.id &&
                      'border-r-4 border-primary-500 bg-primary-50 dark:bg-primary-900/10'
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 text-white font-bold shadow-sm">
                    {ct.name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-neutral-900 dark:text-neutral-100">
                        {ct.name}
                      </h4>
                      {account ? (
                        <CheckCircle
                          className="h-4 w-4 text-emerald-500"
                          title="Has account"
                        />
                      ) : (
                        <XCircle
                          className="h-4 w-4 text-neutral-400"
                          title="No account"
                        />
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">
                      {ct.contactInfo.phone}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {activeCount} active goats
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      ₹{earnings.toLocaleString()}
                    </p>
                    <p className="text-xs text-neutral-500">earnings</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ──────── Details panel ──────── */}
        <main className="lg:col-span-2 space-y-6">
          {selected && (
            <>
              {/* ── Profile card ── */}
              <div className="card">
                <div className="card-body space-y-6">
                  {/* header row */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                        {selected.name}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Caretaker profile
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {/* <button
                        onClick={() => {
                          setInviting(selected);
                          setIsInviteOpen(true);
                        }}
                        className="btn-outline flex items-center gap-2 text-sm"
                      >
                        <UserPlus className="h-4 w-4" />
                        Invite
                      </button> */}
                      <button
                        onClick={() => {
                          setEditing(selected);
                          setIsFormOpen(true);
                        }}
                        className="btn-outline flex items-center gap-2 text-sm"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(selected)}
                        className="flex items-center gap-2 rounded-xl border-2 border-rose-300 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-900/40"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* info grid */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* photo */}
                    <div className="flex flex-col items-center">
                      <div className="mb-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-700">
                        {selected.photo ? (
                          <img
                            src={selected.photo}
                            alt={selected.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users className="h-12 w-12 text-neutral-400" />
                        )}
                      </div>
                      <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {selected.name}
                      </p>
                    </div>

                    {/* contact */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/40">
                        <Phone className="h-5 w-5 text-neutral-500" />
                        <div>
                          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                            Phone
                          </p>
                          <p className="font-bold text-neutral-900 dark:text-neutral-100">
                            {selected.contactInfo.phone}
                          </p>
                        </div>
                      </div>

                      {selected.contactInfo.email && (
                        <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/40">
                          <Mail className="h-5 w-5 text-neutral-500" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                              Email
                            </p>
                            <p className="font-bold text-neutral-900 dark:text-neutral-100">
                              {selected.contactInfo.email}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/40">
                        <Key className="h-5 w-5 text-neutral-500" />
                        <p className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                          {selected.loginCredentials?.hasAccount
                            ? 'Has system account'
                            : 'No account'}
                        </p>
                      </div>
                    </div>

                    {/* misc */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-neutral-400" />
                        <div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Business location
                          </p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {activeBusiness?.address || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-neutral-400" />
                        <div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Payment model
                          </p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {activeBusiness?.paymentModelType === 'percentage'
                              ? `${activeBusiness.paymentModelAmount}% of profit`
                              : `₹${activeBusiness?.paymentModelAmount} monthly`}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Member since</p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {format(selected.createdAt, 'MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Quick stats ── */}
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                  value={activeGoats.length}
                  label="Active goats"
                  icon={Users}
                  gradient="from-emerald-100 to-emerald-200"
                  text="text-emerald-600"
                />
                <StatCard
                  value={soldGoats.length}
                  label="Goats sold"
                  icon={DollarSign}
                  gradient="from-sky-100 to-sky-200"
                  text="text-sky-600"
                />
                <StatCard
                  value={`₹${earnings.toLocaleString()}`}
                  label="Earnings"
                  icon={DollarSign}
                  gradient="from-purple-100 to-purple-200"
                  text="text-purple-600"
                />
              </div>

              {/* ── Tab permissions (COLLAPSIBLE) ── */}
              <div className="card">
                {/* clickable header that toggles body */}
                <button
                  type="button"
                  onClick={() => setShowPerms(p => !p)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Tab permissions
                    </h3>
                    {loadingPerms && <SkeletonCircle />}
                  </div>
                  <ChevronDown
                    className={clsx(
                      'h-5 w-5 transition-transform duration-200',
                      showPerms && 'rotate-180'
                    )}
                  />
                </button>

                {/* body only when expanded */}
                {showPerms && (
                  <div className="card-body pt-0 space-y-6">
                    {!selected.contactInfo.email || !role ? (
                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center dark:border-neutral-600 dark:bg-neutral-700/30">
                        <Key className="mx-auto mb-4 h-8 w-8 text-neutral-500" />
                        <h4 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          No account access
                        </h4>
                        <p className="mx-auto mb-6 max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
                          Create a system account first to manage permissions.
                        </p>
                        <button
                          onClick={() => {
                            setInviting(selected);
                            setIsInviteOpen(true);
                          }}
                          className="btn-secondary"
                        >
                          Create account
                        </button>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {tabs.map(t => {
                          const enabled = role?.permissions?.[t.id];
                          const owner = ['caretakers', 'finances', 'reports'].includes(
                            t.id
                          );

                          return (
                            <li
                              key={t.id}
                              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-5 hover:shadow-sm dark:border-neutral-600 dark:bg-neutral-700/30"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {t.name}
                                  </h4>
                                  {owner && (
                                    <span className="badge bg-orange-100 text-orange-800">
                                      Owner only
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                  {t.desc}
                                </p>
                              </div>

                              <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={enabled}
                                  onChange={e =>
                                    togglePerm(t.id, e.target.checked)
                                  }
                                  disabled={loadingPerms}
                                />
                                <div className="after:content-[''] peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary-600 peer-checked:after:translate-x-full" />
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* ── Assigned goats ── */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Assigned goats
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {assigned.length} goats
                  </p>
                </div>

                {assigned.length ? (
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                    {assigned.map(g => (
                      <div
                        key={g.id}
                        className="flex items-center justify-between gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700">
                            {g.tagNumber}
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {g.nickname || 'Unnamed'}
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {g.breed} • {g.gender}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={g.status} />
                          <p className="mt-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                            {g.currentWeight} kg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
                    No goats assigned yet.
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ──────── Forms / Modals ──────── */}
      <CaretakerForm
        isOpen={isFormOpen}
        caretaker={editing || undefined}
        isEdit={!!editing}
        onClose={() => {
          setIsFormOpen(false);
          setEditing(null);
        }}
      />

      <CaretakerInviteModal
        isOpen={isInviteOpen}
        caretaker={inviting || undefined}
        onClose={() => {
          setIsInviteOpen(false);
          setInviting(null);
        }}
      />
    </div>
  );
};