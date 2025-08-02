import React, { useState } from 'react';
import { ChevronDown, Plus, Building2, BarChart3, Trash2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessCreationModal } from './BusinessCreationModal';

interface BusinessSelectorProps {
  onViewAllBusinesses?: () => void;
}

export const BusinessSelector: React.FC<BusinessSelectorProps> = ({ onViewAllBusinesses }) => {
  const { businesses, activeBusiness, setActiveBusiness, userRole, deleteBusiness } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);

  // Don't show selector if user is only a caretaker with one business
  if (userRole === 'caretaker' && businesses.length <= 1) {
    return activeBusiness ? (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg min-w-0 flex-1">
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-900 truncate">
          {activeBusiness.name}
        </span>
      </div>
    ) : null;
  }

  if (!activeBusiness) {
    return null;
  }

  const handleDeleteBusiness = async (businessId: string, businessName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${businessName}"?\n\n` +
      `This will permanently delete:\n` +
      `• All goats and their records\n` +
      `• All caretakers and their data\n` +
      `• All financial records and transactions\n` +
      `• All health and weight records\n\n` +
      `This action cannot be undone!`
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      `FINAL CONFIRMATION\n\n` +
      `Type "DELETE" in the next prompt to confirm deletion of "${businessName}"`
    );

    if (!doubleConfirmed) return;

    const userInput = prompt(
      `Please type "DELETE" (in capital letters) to confirm deletion of "${businessName}":`
    );

    if (userInput !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    try {
      setDeletingBusinessId(businessId);
      await deleteBusiness(businessId);
      setIsOpen(false);
      alert(`Business "${businessName}" has been successfully deleted.`);
    } catch (error) {
      console.error('Error deleting business:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to delete business: ${errorMessage}\n\nPlease try again or contact support.`);
    } finally {
      setDeletingBusinessId(null);
    }
  };

  return (
    <>
      {/* Parent container with relative positioning */}
      <div className="relative flex-1 min-w-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Building2 className="h-4 w-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {activeBusiness.name}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-neutral-500 dark:text-neutral-400 ml-2 flex-shrink-0" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute top-full left-0 right-0 z-10 mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                Your Businesses
              </div>
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className={`px-4 py-2 transition-colors flex items-center justify-between ${
                    activeBusiness.id === business.id
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                >
                  <button
                    onClick={() => {
                      setActiveBusiness(business);
                      setIsOpen(false);
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="font-medium truncate">{business.name}</div>
                    {business.description && (
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        {business.description}
                      </div>
                    )}
                  </button>
                  {userRole === 'owner' && businesses.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBusiness(business.id, business.name);
                      }}
                      disabled={deletingBusinessId === business.id}
                      className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                      title="Delete Business"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              {userRole === 'owner' && (
                <>
                  {businesses.length > 1 && onViewAllBusinesses && (
                    <>
                      <div className="border-t border-neutral-200 dark:border-neutral-700 my-2" />
                      <button
                        onClick={() => {
                          onViewAllBusinesses();
                          setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-blue-600 dark:text-blue-400 flex items-center space-x-2"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="font-medium truncate">📊 View All Businesses Summary</span>
                      </button>
                    </>
                  )}
                  <div className="border-t border-neutral-200 dark:border-neutral-700 my-2" />
                  <button
                    onClick={() => {
                      setIsCreationModalOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors text-emerald-600 dark:text-emerald-400 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-medium">Create New Business</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <BusinessCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
      />
    </>
  );
};