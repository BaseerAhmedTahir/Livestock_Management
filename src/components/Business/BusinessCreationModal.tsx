// src/components/Business/BusinessCreationModal.tsx
import React, { memo, useCallback, useState } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Button } from '../common/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessCreationModal: React.FC<Props> = memo(
  ({ isOpen, onClose }) => {
    /* ------------------------------------------------------------------ */
    /*                              CONTEXT                               */
    /* ------------------------------------------------------------------ */
    const { createBusiness } = useBusiness();

    /* ------------------------------------------------------------------ */
    /*                              STATE                                 */
    /* ------------------------------------------------------------------ */
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /* ------------------------------------------------------------------ */
    /*                              HANDLERS                              */
    /* ------------------------------------------------------------------ */
    const resetAndClose = useCallback(() => {
      if (loading) return;
      setName('');
      setDesc('');
      setError(null);
      onClose();
    }, [loading, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      setLoading(true);
      setError(null);

      try {
        await createBusiness(name.trim(), desc.trim() || undefined);
        resetAndClose();
      } catch (err: any) {
        setError(err?.message ?? 'Failed to create business');
      } finally {
        setLoading(false);
      }
    };

    /* ------------------------------------------------------------------ */
    /*                              VIEW                                  */
    /* ------------------------------------------------------------------ */
    if (!isOpen) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      >
        {/* overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={resetAndClose}
          aria-hidden="true"
        />

        {/* modal card */}
        <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/30">
                <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Create New Business
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Set up your livestock management
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetAndClose}
              disabled={loading}
              className="rounded-full"
              icon={<X className="h-5 w-5" />}
            />
          </div>

          {/* error alert */}
          {error && (
            <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div className="text-sm">
                <p className="font-medium text-red-800 dark:text-red-300">
                  {error}
                </p>
                <p className="mt-1 text-red-700 dark:text-red-400">
                  Please try again or contact support.
                </p>
              </div>
            </div>
          )}

          {/* form */}
          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-50">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Johar Cattle Farm"
                  required
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-900/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-900 dark:text-gray-50">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Brief description…"
                  disabled={loading}
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 shadow-sm transition focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-900/20"
                />
              </div>
            </div>

            {/* footer buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6 dark:border-gray-700">
              <Button
                variant="secondary"
                size="md"
                onClick={resetAndClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={loading || !name.trim()}
                isLoading={loading}
              >
                {loading ? 'Creating…' : 'Create Business'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  },
);

BusinessCreationModal.displayName = 'BusinessCreationModal';