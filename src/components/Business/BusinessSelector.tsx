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
    // Show business name for caretakers but without dropdown
    return activeBusiness ? (
      // Changed to justify-center for centered text
      <div className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg w-full">
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
    console.log('Starting business deletion process for:', businessName, businessId);
    
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

    // Second confirmation for extra safety
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

    console.log('All confirmations passed, proceeding with deletion...');
    
    try {
      setDeletingBusinessId(businessId);
      
      // Try the standard deletion first
      try {
        await deleteBusiness(businessId);
        console.log('Standard deletion successful');
      } catch (standardError) {
        console.warn('Standard deletion failed, trying alternative method:', standardError);
        
        // If standard deletion fails, try force deletion
        if (typeof (useBusiness() as any).forceDeleteBusiness === 'function') {
          await (useBusiness() as any).forceDeleteBusiness(businessId);
          console.log('Force deletion successful');
        } else {
          throw standardError;
        }
      }
      
      setIsOpen(false);
      alert(`Business "${businessName}" has been successfully deleted.`);
    } catch (error) {
      console.error('Error deleting business:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to delete business: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    } finally {
      setDeletingBusinessId(null);
    }
  };
  return (
    <>
      <div className="relative w-full">
        <button
          onClick={() => setIsOpen(!isOpen)}
          // Added justify-center for centered text
          className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
        >
          <Building2 className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {activeBusiness.name}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Your Businesses
                </div>
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors ${
                      activeBusiness.id === business.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-900'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveBusiness(business);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium">{business.name}</div>
                      {business.description && (
                        <div className="text-sm text-gray-500 truncate">{business.description}</div>
                      )}
                    </button>
                    {userRole === 'owner' && businesses.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBusiness(business.id, business.name);
                        }}
                        disabled={deletingBusinessId === business.id}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
                        <div className="border-t border-gray-200 my-2" />
                        <button
                          onClick={() => {
                            onViewAllBusinesses();
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-blue-600 flex items-center space-x-2"
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span className="font-medium">📊 View All Businesses Summary</span>
                        </button>
                      </>
                    )}
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={() => {
                        setIsCreationModalOpen(true);
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-emerald-600 flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Create New Business</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <BusinessCreationModal
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
      />
    </>
  );
};