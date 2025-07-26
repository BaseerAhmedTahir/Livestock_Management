import React, { useState } from 'react';
import { Search, Plus, Filter, DollarSign } from 'lucide-react';
import { GoatCard } from './GoatCard';
import { GoatModal } from './GoatModal';
import { GoatForm } from '../Forms/GoatForm';
import { SaleForm } from '../Forms/SaleForm';
import { LoadingSpinner } from '../UI/LoadingSpinner';
import { useApp } from '../../context/AppContext';
import { Goat } from '../../types';

export const GoatList: React.FC = () => {
  const { goats, caretakers, loading, error, updateGoat } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedGoat, setSelectedGoat] = useState<Goat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [saleGoat, setSaleGoat] = useState<Goat | null>(null);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading goats: {error}</p>
        </div>
      </div>
    );
  }

  const filteredGoats = goats.filter(goat => {
    const matchesSearch = goat.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goat.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goat.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || goat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGoatClick = (goat: Goat) => {
    setSelectedGoat(goat);
    setIsModalOpen(true);
  };

  const handleSellGoat = (goat: Goat) => {
    setSaleGoat(goat);
    setIsSaleFormOpen(true);
  };

  const handleMarkDeceased = async (goat: Goat) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark ${goat.tagNumber} - ${goat.nickname || 'Unnamed'} as deceased? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        await updateGoat(goat.id, { status: 'Deceased' });
      } catch (error) {
        console.error('Error marking goat as deceased:', error);
        alert('Failed to update goat status. Please try again.');
      }
    }
  };

  const handleAddGoat = () => {
    setIsFormOpen(true);
  };

  const getCaretakerName = (caretakerId?: string) => {
    if (!caretakerId) return 'Unassigned';
    const caretaker = caretakers.find(c => c.id === caretakerId);
    return caretaker?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Goat Management</h2>
          <p className="text-gray-600">Manage your livestock inventory and tracking</p>
        </div>
        <button
          onClick={handleAddGoat}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Goat
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tag number, nickname, or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Sold">Sold</option>
            <option value="Deceased">Deceased</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {goats.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Goats Added</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first goat to the system.</p>
          <button
            onClick={handleAddGoat}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add Your First Goat
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGoats.map((goat) => (
              <GoatCard
                key={goat.id}
                goat={goat}
                caretakerName={getCaretakerName(goat.caretakerId)}
                onViewDetails={() => handleGoatClick(goat)}
                onSellGoat={() => handleSellGoat(goat)}
                onMarkDeceased={() => handleMarkDeceased(goat)}
              />
            ))}
          </div>

          {filteredGoats.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No goats found matching your criteria.</p>
            </div>
          )}
        </>
      )}

      <GoatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goat={selectedGoat}
      />

      <GoatForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {saleGoat && (
        <SaleForm
          isOpen={isSaleFormOpen}
          onClose={() => {
            setIsSaleFormOpen(false);
            setSaleGoat(null);
          }}
          goat={saleGoat}
        />
      )}
    </div>
  );
};