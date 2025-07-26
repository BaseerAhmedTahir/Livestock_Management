// src/components/Business/BusinessSelector.tsx
import React, { memo, useState } from 'react';
import {
  ChevronDown,
  Plus,
  Building2,
  BarChart3,
  Trash2,
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessCreationModal } from './BusinessCreationModal';

interface Props {
  onViewAllBusinesses?: () => void;
}

export const BusinessSelector: React.FC<Props> = memo(
  ({ onViewAllBusinesses }) => {
    /* ------------------------------------------------------------------ */
    /*                              CONTEXT                               */
    /* ------------------------------------------------------------------ */
    const {
      businesses,
      activeBusiness,
      setActiveBusiness,
      userRole,
      deleteBusiness,
    } = useBusiness();

    /* ------------------------------------------------------------------ */
    /*                              STATE                                 */
    /* ------------------------------------------------------------------ */
    const [open, setOpen] = useState(false);
    const [createModal, setCreateModal] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    /* ------------------------------------------------------------------ */
    /*      HIDE SELECTOR WHEN CARETAKER HAS ONLY ONE BUSINESS            */
    /* ------------------------------------------------------------------ */
    if (userRole === 'caretaker' && businesses.length <= 1) {
      return activeBusiness ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <span className="truncate text-sm font-medium text-gray-900">
            {activeBusiness.name}
          </span>
        </div>
      ) : null;
    }

    if (!activeBusiness) return null;

    /* ------------------------------------------------------------------ */
    /*                          DELETE BUSINESS                           */
    /* ------------------------------------------------------------------ */
    const confirmDeletion = async (id: string, name: string) => {
      // multi-step confirmation
      if (
        !window.confirm(
          `Are you sure you want to delete "${name}"?\n\nThis removes ALL records and cannot be undone.`,
        )
      )
        return;
      if (
        !window.confirm(
          `FINAL WARNING:\nType DELETE in the next prompt to remove "${name}".`,
        )
      )
        return;
      const typed = prompt('Type DELETE to confirm:');
      if (typed !== 'DELETE') {
        alert('Deletion cancelled (exact word not entered).');
        return;
      }

      setDeleting(id);
      try {
        await deleteBusiness(id);
        alert(`"${name}" was deleted.`);
        setOpen(false);
      } catch (err: any) {
        alert(
          `Failed to delete "${name}".\n\n${err?.message ?? 'Unknown error.'}`,
        );
      } finally {
        setDeleting(null);
      }
    };

    /* ------------------------------------------------------------------ */
    /*                              VIEW                                  */
    /* ------------------------------------------------------------------ */
    return (
      <>
        <div className="relative w-full">
          {/* --------- Toggle button --------- */}
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((p) => !p)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-gray-50 focus:outline-none focus:ring dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="truncate text-gray-900 dark:text-gray-50">
              {activeBusiness.name}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>

          {/* --------- Dropdown --------- */}
          {open && (
            <>
              {/* overlay to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpen(false)}
              />

              <div className="absolute left-0 z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="py-2">
                  <p className="px-4 pb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Your businesses
                  </p>

                  {businesses.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center justify-between px-4 py-2 transition hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                        activeBusiness.id === b.id
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <button
                        type="button"
                        className="flex-1 text-left"
                        onClick={() => {
                          setActiveBusiness(b);
                          setOpen(false);
                        }}
                      >
                        <div className="font-medium">{b.name}</div>
                        {b.description && (
                          <div className="truncate text-sm text-gray-500 dark:text-gray-400">
                            {b.description}
                          </div>
                        )}
                      </button>

                      {userRole === 'owner' && businesses.length > 1 && (
                        <button
                          type="button"
                          title="Delete business"
                          disabled={deleting === b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeletion(b.id, b.name);
                          }}
                          className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:hover:bg-red-700/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* ----- Owner actions ----- */}
                  {userRole === 'owner' && (
                    <>
                      {businesses.length > 1 && onViewAllBusinesses && (
                        <>
                          <hr className="my-2 border-gray-200 dark:border-gray-700" />
                          <button
                            type="button"
                            onClick={() => {
                              onViewAllBusinesses();
                              setOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-blue-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700/40"
                          >
                            <BarChart3 className="h-4 w-4" />
                            <span>View all businesses summary</span>
                          </button>
                        </>
                      )}

                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <button
                        type="button"
                        onClick={() => {
                          setCreateModal(true);
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-emerald-600 hover:bg-gray-50 dark:text-emerald-400 dark:hover:bg-gray-700/40"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create new business</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ----------------- Create modal ----------------- */}
        <BusinessCreationModal
          isOpen={createModal}
          onClose={() => setCreateModal(false)}
        />
      </>
    );
  },
);

BusinessSelector.displayName = 'BusinessSelector';