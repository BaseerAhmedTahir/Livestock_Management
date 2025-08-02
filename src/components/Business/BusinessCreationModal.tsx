// BusinessCreationModal.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface BusinessCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessCreationModal: React.FC<BusinessCreationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createBusiness } = useBusiness();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [paymentModelType, setPaymentModelType] = useState<'percentage' | 'monthly'>('percentage');
  const [paymentModelAmount, setPaymentModelAmount] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ──────────────────────────── Handlers ──────────────────────────── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await createBusiness(
        name.trim(),
        description.trim() || undefined,
        address.trim(),
        paymentModelType,
        paymentModelAmount
      );

      // reset
      setName('');
      setDescription('');
      setAddress('');
      setPaymentModelType('percentage');
      setPaymentModelAmount(15);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    // reset
    setName('');
    setDescription('');
    setAddress('');
    setPaymentModelType('percentage');
    setPaymentModelAmount(15);
    setError(null);

    onClose();
  };

  /* ──────────────────────────── Early exit ──────────────────────────── */

  if (!isOpen) return null;

  /* ────────────────────────────── Markup ───────────────────────────── */

  const modalMarkup = (
    <div className="fixed inset-0 z-[999] bg-black/50 p-4 flex items-center justify-center">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-xl border border-neutral-200 dark:border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
              Create New Business
            </h2>
          </div>

          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-neutral-400" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-20 space-y-4">
          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Johar Cattle Farm"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Brief description of your business..."
              disabled={loading}
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Business Address *
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Village Kalar Kahar, Punjab"
              required
              disabled={loading}
            />
          </div>

          {/* Payment model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              Caretaker Payment Model *
            </label>
            <select
              value={paymentModelType}
              onChange={(e) => setPaymentModelType(e.target.value as 'percentage' | 'monthly')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={loading}
            >
              <option value="percentage">Percentage of Profit</option>
              <option value="monthly">Monthly Fixed Amount</option>
            </select>
          </div>

          {/* Payment amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              {paymentModelType === 'percentage' ? 'Percentage (%)' : 'Monthly Amount (₹)'}
            </label>
            <input
              type="number"
              value={paymentModelAmount}
              onChange={(e) => setPaymentModelAmount(Number(e.target.value))}
              step={paymentModelType === 'percentage' ? '0.1' : '1'}
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder={paymentModelType === 'percentage' ? '15' : '5000'}
              required
              disabled={loading}
            />
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
              {paymentModelType === 'percentage'
                ? 'Percentage of profit that caretakers will receive when goats are sold'
                : 'Fixed monthly amount to be paid to caretakers'}
            </p>
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 dark:text-neutral-300 border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !address.trim()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Business'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* ────────────────────────────── Portal ───────────────────────────── */

  // Guard for SSR (Next.js etc.)
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalMarkup, document.body);
};