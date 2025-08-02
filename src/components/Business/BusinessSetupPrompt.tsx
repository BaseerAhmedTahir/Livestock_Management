import React, { useState } from 'react';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../hooks/useAuth';

export const BusinessSetupPrompt: React.FC = () => {
  const { createBusiness, userRole } = useBusiness();
  const { signOut } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [paymentModelType, setPaymentModelType] = useState<'percentage' | 'monthly'>('percentage');
  const [paymentModelAmount, setPaymentModelAmount] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user is a caretaker, show different message
  if (userRole === 'caretaker') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Pending</h1>
          <p className="text-gray-600 mb-6">
            Your caretaker account has been created successfully. Please wait for the business owner to assign you to a business or contact them if you believe this is an error.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="text-left">
              <h4 className="font-medium text-blue-900 mb-1">What to do next:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Contact the business owner who invited you</li>
                <li>• Verify you're using the correct email address</li>
                <li>• Ask them to check your business assignment</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={signOut}
            className="flex items-center justify-center w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    );
  }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6 sm:p-8 overflow-y-auto pb-20">
        <div className="flex justify-end mb-4">
          <button
            onClick={signOut}
            className="flex items-center px-3 py-2 text-gray-600 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Welcome to LivestockPro</h1>
          <p className="text-gray-600 dark:text-neutral-400">Let's set up your first business to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                : 'Fixed monthly amount to be paid to caretakers'
              }
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim() || !address.trim()}
            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              'Creating Business...'
            ) : (
              <>
                Create Business
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            The payment model will apply to all caretakers in this business
          </p>
        </div>
      </div>
    </div>
  );
};