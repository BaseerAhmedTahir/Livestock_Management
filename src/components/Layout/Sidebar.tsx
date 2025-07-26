import React from 'react';
import { 
  BarChart3, 
  Users, 
  Activity, 
  DollarSign, 
  Camera, 
  FileText,
  Settings,
  X
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeTab, onTabChange }) => {
  const { userRole, caretakerPermissions } = useBusiness();

  // Define navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
      { id: 'goats', name: 'Goat Management', icon: Users },
      { id: 'health', name: 'Health Records', icon: Activity },
      { id: 'scanner', name: 'QR Scanner', icon: Camera },
      { id: 'settings', name: 'Settings', icon: Settings },
    ];

    if (userRole === 'owner') {
      // Add owner-only features
      baseNavigation.splice(3, 0, 
        { id: 'caretakers', name: 'Caretakers', icon: Users },
        { id: 'finances', name: 'Finances', icon: DollarSign },
        { id: 'reports', name: 'Reports', icon: FileText }
      );
    } else if (userRole === 'caretaker' && caretakerPermissions) {
      // Filter navigation based on caretaker permissions
      const filteredNavigation = baseNavigation.filter(item => {
        // Check if permission exists and is true
        return caretakerPermissions[item.id] === true;
      });
      
      // Add owner-only features if caretaker has permission
      const ownerFeatures = [];
      if (caretakerPermissions.caretakers) {
        ownerFeatures.push({ id: 'caretakers', name: 'Caretakers', icon: Users });
      }
      if (caretakerPermissions.finances) {
        ownerFeatures.push({ id: 'finances', name: 'Finances', icon: DollarSign });
      }
      if (caretakerPermissions.reports) {
        ownerFeatures.push({ id: 'reports', name: 'Reports', icon: FileText });
      }
      
      // Insert owner features at the appropriate position
      if (ownerFeatures.length > 0) {
        const scannerIndex = filteredNavigation.findIndex(item => item.id === 'scanner');
        if (scannerIndex !== -1) {
          filteredNavigation.splice(scannerIndex, 0, ...ownerFeatures);
        } else {
          filteredNavigation.push(...ownerFeatures);
        }
      }
      
      return filteredNavigation;
    }

    return baseNavigation;
  };

  const navigation = getNavigation();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      
      <nav className="mt-4 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onTabChange(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};