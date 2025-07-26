import React from 'react';
import { AlertCircle, Mail } from 'lucide-react';

export const CaretakerAccessError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          No business access found. Please contact the business owner who invited you.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h4 className="font-medium text-yellow-900 mb-1">What to do next:</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>• Contact the business owner who invited you</li>
                <li>• Ask them to check your invitation status</li>
                <li>• Verify you're using the correct email address</li>
                <li>• Request a new invitation if needed</li>
              </ul>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact support or the business administrator.
        </p>
      </div>
    </div>
  );
};