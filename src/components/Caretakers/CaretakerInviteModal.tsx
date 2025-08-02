import React, { useState } from 'react';
import { X, Mail, Send, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Caretaker } from '../../types';

interface CaretakerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  caretaker?: Caretaker;
}

export const CaretakerInviteModal: React.FC<CaretakerInviteModalProps> = ({ 
  isOpen, 
  onClose, 
  caretaker 
}) => {
  const { inviteCaretaker, activeBusiness } = useBusiness();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [accountDetails, setAccountDetails] = useState<{email: string, password: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !activeBusiness) return;

    setLoading(true);
    setError(null);

    console.log('Starting caretaker invitation process...');
    console.log('Email:', email);
    console.log('Business ID:', activeBusiness.id);
    console.log('Caretaker ID:', caretaker?.id);
    try {
      const result = await inviteCaretaker(email.trim(), activeBusiness.id, caretaker?.id, password.trim());
      console.log('Invitation result:', result);
      setSuccess(true);
      setAccountDetails({
        email: result.email,
        password: result.password
      });
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Invitation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite caretaker');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setPassword('');
      setError(null);
      setSuccess(false);
      setAccountDetails(null);
      onClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto pb-20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Create Caretaker Account
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success && accountDetails && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3">✅ Caretaker Account Created Successfully!</h4>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Email:</span>
                  <button
                    onClick={() => copyToClipboard(accountDetails.email)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <p className="font-mono text-sm text-gray-900">{accountDetails.email}</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Password:</span>
                  <button
                    onClick={() => copyToClipboard(accountDetails.password)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
                <p className="font-mono text-sm text-gray-900 bg-gray-100 p-2 rounded">{accountDetails.password}</p>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Important:</strong> Share these credentials securely with the caretaker. They can change their password after logging in.
            </div>
          </div>
        )}

        <div className="p-6">
          {caretaker && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Inviting for: {caretaker.name}</h4>
              <p className="text-blue-700 text-sm">
                This will create a permanent login account that allows {caretaker.name} to access only the 
                <strong> {activeBusiness?.name}</strong> business data.
              </p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Caretaker Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="caretaker@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a password (can be simple like 'john123')"
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can choose any password - simple ones are allowed. The caretaker can change it later.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <h5 className="font-medium text-yellow-900 mb-1">Important Notes:</h5>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• A permanent account will be created with your chosen password</li>
                <li>• The caretaker will be automatically linked to this business</li>
                <li>• They can only see data for <strong>{activeBusiness?.name}</strong></li>
                <li>• They cannot access your other businesses</li>
                <li>• They can change their password after logging in</li>
                <li>• You can revoke access anytime</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
            </form>
          )}

          {success && (
            <div className="flex justify-end pt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};