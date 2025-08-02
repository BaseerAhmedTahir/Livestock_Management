import React from 'react';
import { AlertCircle, Mail } from 'lucide-react';

export const CaretakerAccessError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-neutral-400 mb-6">
          No business access found. Please contact the business owner who invited you.
        </p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">What to do next:</h4>
              <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1">
                <li>• Contact the business owner who invited you</li>
                <li>• Ask them to check your invitation status</li>
                <li>• Verify you're using the correct email address</li>
                <li>• Request a new invitation if needed</li>
              </ul>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-neutral-400">
          If you believe this is an error, please contact support or the business administrator.
        </p>
      </div>
    </div>
  );
};