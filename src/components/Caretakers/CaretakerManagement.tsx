/* -----------------------------------------------------------------
   CaretakerManagement.tsx
   Manage staff, permissions & performance – modern & responsive.
------------------------------------------------------------------ */

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  DollarSign,
  UserPlus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../lib/supabase';
import { CaretakerForm } from '../Forms/CaretakerForm';
import { CaretakerInviteModal } from './CaretakerInviteModal';
import { Caretaker, UserBusinessRole } from '../../types';

/* --------------------------- UI helpers ------------------------ */

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <header>
    <h2 className="text-2xl font-extrabold text-gray-900">{title}</h2>
    {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
  </header>
);

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, value, color = 'emerald', icon }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-sm">
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className={clsx('text-2xl font-bold', `text-${color}-600`)}>{value}</p>
    </div>
    {icon}
  </div>
);

const ToggleSwitch: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = ({ checked, disabled, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
  </label>
);

/* ---------------------- Main component ------------------------- */

export const CaretakerManagement: React.FC = () => {
  /* ---------- context & global state ---------- */
  const { caretakers, goats, deleteCaretaker } = useApp();
  const { user } = useAuth();
  const {
    activeBusiness,
    updateCaretakerBusinessRolePermissions,
  } = useBusiness();

  /* ---------- local UI state ---------- */
  const [selectedId, setSelectedId] = useState<string | undefined>(
    caretakers[0]?.id,
  );
  const [isFormOpen, setFormOpen] = useState(false);
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [editingCaretaker, setEditingCaretaker] = useState<Caretaker | null>(
    null,
  );
  const [invitingCaretaker, setInvitingCaretaker] = useState<Caretaker | null>(
    null,
  );
  const [caretakerRole, setCaretakerRole] = useState<UserBusinessRole | null>(
    null,
  );
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permExpanded, setPermExpanded] = useState(true);

  const selected = caretakers.find((c) => c.id === selectedId);

  /* ---------- memo helpers ---------- */
  const assigned = selected
    ? goats.filter((g) => g.caretakerId === selected.id)
    : [];
  const active = assigned.filter((g) => g.status === 'Active');
  const sold = assigned.filter((g) => g.status === 'Sold');

  const calcEarnings = (ct: Caretaker) => {
    const soldGoats = goats.filter(
      (g) => g.caretakerId === ct.id && g.status === 'Sold',
    );
    const profitSum = soldGoats.reduce((s, g) => {
      if (!g.salePrice) return s;
      return s + (g.salePrice - g.purchasePrice);
    }, 0);
    return ct.paymentModel.type === 'percentage'
      ? (profitSum * ct.paymentModel.amount) / 100
      : soldGoats.length * ct.paymentModel.amount;
  };

  /* ---------- fetch role / permissions ---------- */
  useEffect(() => {
    const fetchRole = async () => {
      if (!selected?.contactInfo.email || !activeBusiness) {
        setCaretakerRole(null);
        return;
      }
      try {
        setLoadingPermissions(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');
        const { data, error } = await supabase.functions.invoke(
          'get-user-by-email',
          {
            body: {
              email: selected.contactInfo.email,
              businessId: activeBusiness.id,
            },
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        );
        if (error || !data?.success) {
          setCaretakerRole(null);
          return;
        }
        const role = data.userBusinessRole;
        setCaretakerRole({
          id: role.id,
          userId: role.user_id,
          businessId: role.business_id,
          role: role.role,
          linkedCaretakerId: role.linked_caretaker_id ?? undefined,
          createdAt: new Date(role.created_at),
          permissions: role.permissions ?? getDefaultPermissions(),
        });
      } finally {
        setLoadingPermissions(false);
      }
    };
    fetchRole();
  }, [selected, activeBusiness]);

  /* ---------- default permissions ---------- */
  const getDefaultPermissions = () =>
    ({
      dashboard: true,
      goats: true,
      health: true,
      scanner: true,
      settings: true,
      caretakers: false,
      finances: false,
      reports: false,
    } as Record<string, boolean>);

  /* ---------- Permission toggle ---------- */
  const togglePerm = async (tabId: string, enabled: boolean) => {
    if (!caretakerRole) return;
    const updated = { ...caretakerRole.permissions, [tabId]: enabled };
    try {
      await updateCaretakerBusinessRolePermissions(caretakerRole.id, updated);
      setCaretakerRole({ ...caretakerRole, permissions: updated });
    } catch (err) {
      console.error(err);
      alert('Failed to update permission. Try again.');
    }
  };

  /* ---------- Delete caretaker ---------- */
  const confirmDelete = async (ct: Caretaker) => {
    const assignedCount = goats.filter((g) => g.caretakerId === ct.id).length;
    const msg =
      assignedCount > 0
        ? `${ct.name} has ${assignedCount} assigned goats. Deleting will un-assign them. Continue?`
        : `Delete ${ct.name}? This cannot be undone.`;
    if (!window.confirm(msg)) return;

    await deleteCaretaker(ct.id);
    setSelectedId(
      caretakers.filter((c) => c.id !== ct.id)[0]?.id ?? undefined,
    );
  };

  /* --------------------------- tabs --------------------------- */
  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'View business overview',
    },
    { id: 'goats', name: 'Goat Management', description: 'Manage goat data' },
    { id: 'health', name: 'Health Records', description: 'Add treatments' },
    { id: 'scanner', name: 'QR Scanner', description: 'Scan tags' },
    { id: 'settings', name: 'Settings', description: 'Account settings' },
    {
      id: 'caretakers',
      name: 'Caretakers',
      description: 'Manage staff (owner only)',
    },
    {
      id: 'finances',
      name: 'Finances',
      description: 'See financial data (owner)',
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Generate reports (owner)',
    },
  ];
  const ownerTabs = ['caretakers', 'finances', 'reports'];

  /* ============================================================ */
  /*                         RENDER                               */
  /* ============================================================ */

  /* 0️⃣ Empty state */
  if (!caretakers.length)
    return (
      <section className="space-y-8">
        <SectionTitle
          title="Caretaker Management"
          subtitle="Add staff & assign goats"
        />
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-700">
            You haven’t added any caretakers yet.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Add your first caretaker
          </button>
        </div>
        <CaretakerForm
          isOpen={isFormOpen}
          onClose={() => setFormOpen(false)}
          isEdit={false}
        />
      </section>
    );

  /* 1️⃣ Normal state */
  return (
    <section className="space-y-8">
      {/* ---------------- header ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SectionTitle
          title="Caretaker Management"
          subtitle="Manage staff & permissions"
        />
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4" />
          Add caretaker
        </button>
      </div>

      {/* ---------------- main grid ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- sidebar ---------- */}
        <aside className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <h3 className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900">
            Caretakers
          </h3>
          <ul className="divide-y divide-gray-200">
            {caretakers.map((ct) => {
              const ctGoats = goats.filter((g) => g.caretakerId === ct.id);
              const activeCount = ctGoats.filter(
                (g) => g.status === 'Active',
              ).length;
              const hasAccount = ct.loginCredentials?.hasAccount;
              return (
                <li key={ct.id}>
                  <button
                    onClick={() => setSelectedId(ct.id)}
                    className={clsx(
                      'w-full text-left p-4 hover:bg-gray-50 flex justify-between',
                      selectedId === ct.id &&
                        'bg-emerald-50 border-r-2 border-emerald-500',
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-gray-900">{ct.name}</p>
                        {hasAccount ? (
                          <CheckCircle2
                            title="Has system account"
                            className="w-4 h-4 text-green-500"
                          />
                        ) : (
                          <XCircle
                            title="No system account"
                            className="w-4 h-4 text-gray-400"
                          />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">
                        {ct.contactInfo.phone}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activeCount} active goats
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-600">
                        ₹{calcEarnings(ct).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">earnings</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* ---------- detail panel ---------- */}
        <div className="lg:col-span-2 space-y-6">
          {selected && (
            <>
              {/* Profile Card */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selected.name}
                    </h3>
                    <p className="text-sm text-gray-600">Caretaker profile</p>
                  </div>
                  <div className="inline-flex flex-wrap gap-2">
                    {/* <button
                      onClick={() => {
                        setInvitingCaretaker(selected);
                        setInviteOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </button> */}
                    <button
                      onClick={() => {
                        setEditingCaretaker(selected);
                        setFormOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(selected)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* info grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* photo */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3">
                      {selected.photo ? (
                        <img
                          src={selected.photo}
                          alt={selected.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{selected.name}</p>
                  </div>

                  {/* contact */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {selected.contactInfo.phone}
                    </div>
                    {selected.contactInfo.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {selected.contactInfo.email}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-400" />
                      {selected.loginCredentials?.hasAccount ? (
                        <span className="text-green-700">Active account</span>
                      ) : (
                        <span className="text-gray-500">No account</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {selected.contactInfo.address}
                    </div>
                  </div>

                  {/* model / meta */}
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {selected.paymentModel.type === 'percentage'
                        ? `${selected.paymentModel.amount}% of profit`
                        : `₹${selected.paymentModel.amount} per goat`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {assigned.length} assigned goats
                    </div>
                    <div>
                      Member since{' '}
                      {format(selected.createdAt, 'MMM yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <button
                  onClick={() => setPermExpanded(!permExpanded)}
                  className="w-full flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Tab permissions
                    </h4>
                    <p className="text-sm text-gray-600">
                      Control caretaker access
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingPermissions && (
                      <span className="animate-spin h-5 w-5 rounded-full border-b-2 border-emerald-600" />
                    )}
                    {permExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {permExpanded && (
                  <div className="px-6 pb-6 space-y-4">
                    {!selected.contactInfo.email || !caretakerRole ? (
                      <div className="py-8 text-center bg-gray-50 rounded-lg">
                        <KeyRound className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-700 mb-4">
                          This caretaker doesn’t have an account yet.
                        </p>
                        <button
                          onClick={() => {
                            setInvitingCaretaker(selected);
                            setInviteOpen(true);
                          }}
                          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                        >
                          Create account
                        </button>
                      </div>
                    ) : (
                      tabs.map((tab) => {
                        const enabled =
                          caretakerRole.permissions?.[tab.id] ?? false;
                        const ownerFeature = ownerTabs.includes(tab.id);
                        return (
                          <div
                            key={tab.id}
                            className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {tab.name}
                                </p>
                                {ownerFeature && (
                                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {tab.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <ToggleSwitch
                                checked={enabled}
                                disabled={loadingPermissions}
                                onChange={(e) =>
                                  togglePerm(tab.id, e.target.checked)
                                }
                              />
                              <span className="text-sm">
                                {enabled ? 'On' : 'Off'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Active goats"
                  value={active.length}
                  color="emerald"
                  icon={<Users className="w-7 h-7 text-emerald-500" />}
                />
                <StatCard
                  label="Goats sold"
                  value={sold.length}
                  color="blue"
                  icon={<DollarSign className="w-7 h-7 text-blue-500" />}
                />
                <StatCard
                  label="Earnings"
                  value={`₹${calcEarnings(selected).toLocaleString()}`}
                  color="purple"
                  icon={<DollarSign className="w-7 h-7 text-purple-500" />}
                />
              </div>

              {/* assigned goats list */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <h4 className="px-6 py-4 border-b border-gray-200 font-semibold text-gray-900">
                  Assigned goats
                </h4>
                {assigned.length ? (
                  <ul className="divide-y divide-gray-200">
                    {assigned.map((g) => (
                      <li
                        key={g.id}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {g.tagNumber}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {g.tagNumber} – {g.nickname}
                            </p>
                            <p className="text-xs text-gray-600">
                              {g.breed} • {g.gender}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
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
                          <p className="text-xs text-gray-600 mt-0.5">
                            {g.currentWeight} kg
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No goats assigned.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* -------------- Modals / Forms -------------- */}
      <CaretakerForm
        isOpen={isFormOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingCaretaker(null);
        }}
        caretaker={editingCaretaker ?? undefined}
        isEdit={!!editingCaretaker}
      />

      <CaretakerInviteModal
        isOpen={isInviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInvitingCaretaker(null);
        }}
        caretaker={invitingCaretaker ?? undefined}
      />
    </section>
  );
};