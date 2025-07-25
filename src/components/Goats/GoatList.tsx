import React, { useState } from 'react';
import { Search, Plus, Filter, MapPin } from 'lucide-react';
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
  const [caretakerFilter, setCaretakerFilter] = useState('All');
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
    const matchesCaretaker = 
      caretakerFilter === 'All' || 
      (caretakerFilter === 'unassigned' ? !goat.caretakerId : goat.caretakerId === caretakerFilter);
    return matchesSearch && matchesStatus && matchesCaretaker;
  });

  const getCaretakerName = (caretakerId?: string) => {
    if (!caretakerId) return 'Unassigned';
    const caretaker = caretakers.find(c => c.id === caretakerId);
    return caretaker?.name || 'Unknown';
  };

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

  return (
    <div className="space-y-6">
      {/* Header Section with gradient background */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Goat Management
            </h2>
            <p className="text-gray-600 mt-1">Manage your livestock inventory and tracking</p>
          </div>
          <button
            onClick={handleAddGoat}
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg 
                     hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-sm hover:shadow-md
                     transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Goat
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tag number, nickname, or breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-gray-200 rounded-lg bg-gray-50 focus:bg-white
                       focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-3 w-full appearance-none border border-gray-200 rounded-lg bg-gray-50
                       focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200
                       cursor-pointer"
            >
              <option value="All">Filter by Status</option>
              <option value="Active">Active</option>
              <option value="Sold">Sold</option>
              <option value="Deceased">Deceased</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Caretaker Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={caretakerFilter}
              onChange={(e) => setCaretakerFilter(e.target.value)}
              className="pl-10 pr-4 py-3 w-full appearance-none border border-gray-200 rounded-lg bg-gray-50
                       focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200
                       cursor-pointer"
            >
              <option value="All">Filter by Caretaker</option>
              {caretakers.map((caretaker) => (
                <option key={caretaker.id} value={caretaker.id}>{caretaker.name}</option>
              ))}
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Goat List */}
      {goats.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">No Goats Added Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Get started by adding your first goat to the system. Keep track of your livestock efficiently.</p>
          <button
            onClick={handleAddGoat}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg 
                     hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-sm hover:shadow-md
                     transform hover:-translate-y-0.5"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Goat
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matches Found</h3>
              <p className="text-gray-600">No goats found matching your search criteria. Try adjusting your filters.</p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
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
