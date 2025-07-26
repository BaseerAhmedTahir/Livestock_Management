import React, { useState } from 'react';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { useAuth } from '../../hooks/useAuth';

export const BusinessSetupPrompt: React.FC = () => {
  const { createBusiness, userRole } = useBusiness();
  const { signOut } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await createBusiness(name.trim(), description.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={signOut}
            className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LivestockPro</h1>
          <p className="text-gray-600">Let's set up your first business to get started</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <button
            type="submit"
            disabled={loading || !name.trim()}
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
          <p className="text-sm text-gray-500">
            You can create multiple businesses and switch between them later
          </p>
        </div>
      </div>
    </div>
  );
};