import React from 'react';
import { DashboardStats } from './DashboardStats';
import { RecentActivity } from './RecentActivity';
import { PerformanceChart } from './PerformanceChart';
import { GlobalBusinessDashboard } from './GlobalBusinessDashboard';
import { BarChart3 } from 'lucide-react';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';

interface DashboardProps {
  onViewAllBusinesses?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewAllBusinesses }) => {
  const { goats, loading, error } = useApp();
  const { businesses, userRole } = useBusiness();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (goats.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to LivestockPro</h2>
          <p className="text-gray-600">Get started by adding your first goat to the system.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goats Added Yet</h3>
            <p className="text-gray-600 mb-6">
              Start managing your livestock by adding your first goat. You can track health records, 
              weight changes, assign caretakers, and monitor your investment returns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h2>
            <p className="text-gray-600">Welcome back! Here's what's happening with your livestock.</p>
          </div>
          {userRole === 'owner' && businesses.length > 1 && onViewAllBusinesses && (
            <button
              onClick={onViewAllBusinesses}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              View All Businesses
            </button>
          )}
        </div>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceChart />
        <RecentActivity />
      </div>
    </div>
  );
};