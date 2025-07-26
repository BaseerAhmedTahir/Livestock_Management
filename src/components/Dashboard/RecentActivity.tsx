import React from 'react';
import { Clock, DollarSign, Heart, Scale } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';

export const RecentActivity: React.FC = () => {
  const { goats, healthRecords, weightRecords, expenses } = useApp();
  
  // Generate real activities from data
  const activities = React.useMemo(() => {
    const recentActivities: any[] = [];
    
    // Add recent sales
    goats.filter(g => g.status === 'Sold' && g.saleDate)
      .sort((a, b) => (b.saleDate?.getTime() || 0) - (a.saleDate?.getTime() || 0))
      .slice(0, 2)
      .forEach(goat => {
        recentActivities.push({
          id: `sale-${goat.id}`,
          type: 'sale',
          message: `${goat.tagNumber} (${goat.nickname || 'Unnamed'}) sold for ₹${goat.salePrice?.toLocaleString()}`,
          timestamp: goat.saleDate!,
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-100'
        });
      });
    
    // Add recent health records
    healthRecords
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 2)
      .forEach(record => {
        const goat = goats.find(g => g.id === record.goatId);
        recentActivities.push({
          id: `health-${record.id}`,
          type: 'health',
          message: `${goat?.tagNumber} completed ${record.type.toLowerCase()} - ${record.description}`,
          timestamp: record.date,
          icon: Heart,
          color: 'text-red-600 bg-red-100'
        });
      });
    
    // Add recent weight records
    weightRecords
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 2)
      .forEach(record => {
        const goat = goats.find(g => g.id === record.goatId);
        recentActivities.push({
          id: `weight-${record.id}`,
          type: 'weight',
          message: `${goat?.tagNumber} weight updated to ${record.weight}kg`,
          timestamp: record.date,
          icon: Scale,
          color: 'text-blue-600 bg-blue-100'
        });
      });
    
    // Add recent expenses
    expenses
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 2)
      .forEach(expense => {
        recentActivities.push({
          id: `expense-${expense.id}`,
          type: 'expense',
          message: `${expense.category} expense added - ₹${expense.amount.toLocaleString()}`,
          timestamp: expense.date,
          icon: DollarSign,
          color: 'text-purple-600 bg-purple-100'
        });
      });
    
    // Sort by timestamp and return top 5
    return recentActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [goats, healthRecords, weightRecords, expenses]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      {activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${activity.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 text-gray-400 mr-1" />
                    <p className="text-xs text-gray-500">
                      {format(activity.timestamp, 'MMM dd, yyyy at h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent activities</p>
          <p className="text-sm text-gray-400">Activities will appear here as you use the system</p>
        </div>
      )}
    </div>
  );
};