import React, { useState } from 'react';
import { Plus, Filter, Calendar, Heart, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { HealthRecordForm } from '../Forms/HealthRecordForm';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';

export const HealthRecords: React.FC = () => {
  const { healthRecords, goats, loading, error } = useApp();
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading health records: {error}</p>
        </div>
      </div>
    );
  }

  const filteredRecords = healthRecords.filter(record => {
    const matchesType = filterType === 'All' || record.type === filterType;
    const matchesStatus = filterStatus === 'All' || record.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getGoatInfo = (goatId: string) => {
    const goat = goats.find(g => g.id === goatId);
    return goat ? `${goat.tagNumber} - ${goat.nickname || 'Unnamed'}` : 'Unknown Goat';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Vaccination':
        return '💉';
      case 'Illness':
        return '🤒';
      case 'Injury':
        return '🩹';
      case 'Deworming':
        return '💊';
      case 'Checkup':
        return '🔍';
      case 'Reproductive':
        return '🐣';
      default:
        return '📋';
    }
  };

  const upcomingDue = healthRecords
    .filter(record => record.nextDueDate && record.nextDueDate > new Date())
    .sort((a, b) => (a.nextDueDate?.getTime() || 0) - (b.nextDueDate?.getTime() || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Health Records</h2>
          <p className="text-gray-600">Monitor and track the health status of your livestock</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Health Record
        </button>
      </div>

      {upcomingDue.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-900">Upcoming Due Dates</h3>
          </div>
          <div className="space-y-2">
            {upcomingDue.map((record) => (
              <div key={record.id} className="flex justify-between items-center text-sm">
                <span className="text-yellow-800">
                  {getGoatInfo(record.goatId)} - {record.type}
                </span>
                <span className="text-yellow-600 font-medium">
                  {record.nextDueDate && format(record.nextDueDate, 'MMM dd, yyyy')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All Types</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Illness">Illness</option>
            <option value="Injury">Injury</option>
            <option value="Deworming">Deworming</option>
            <option value="Checkup">Checkup</option>
            <option value="Reproductive">Reproductive</option>
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="All">All Status</option>
          <option value="Healthy">Healthy</option>
          <option value="Under Treatment">Under Treatment</option>
          <option value="Recovered">Recovered</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Health Records</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredRecords.map((record) => (
            <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getTypeIcon(record.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{record.type}</h4>
                      <p className="text-sm text-gray-600">{getGoatInfo(record.goatId)}</p>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-2">{record.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{format(record.date, 'MMM dd, yyyy')}</span>
                    </div>
                    {record.treatment && (
                      <div>
                        <strong>Treatment:</strong> {record.treatment}
                      </div>
                    )}
                    {record.veterinarian && (
                      <div>
                        <strong>Vet:</strong> {record.veterinarian}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-medium text-gray-900">Cost: ₹{record.cost}</span>
                    {record.nextDueDate && (
                      <span className="text-sm text-yellow-600">
                        Next due: {format(record.nextDueDate, 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
                
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  record.status === 'Healthy' ? 'bg-emerald-100 text-emerald-800' :
                  record.status === 'Under Treatment' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No health records found matching your criteria.</p>
          </div>
        )}
      </div>

      <HealthRecordForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />
    </div>
  );
};