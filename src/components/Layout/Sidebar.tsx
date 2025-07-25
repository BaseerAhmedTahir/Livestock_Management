import React from 'react';
import {
  BarChart3,
  Users,
  Activity,
  DollarSign,
  Camera,
  FileText,
  Settings,
  X,
  Menu,
  PawPrint
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpen,
  activeTab,
  onTabChange
}) => {
  const { userRole, caretakerPermissions } = useBusiness();

  const getNavigation = () => {
    const baseNavigation = [
      { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
      { id: 'goats', name: 'Goat Management', icon: PawPrint },
      { id: 'health', name: 'Health Records', icon: Activity },
      { id: 'scanner', name: 'QR Scanner', icon: Camera },
      { id: 'settings', name: 'Settings', icon: Settings },
    ];

    if (userRole === 'owner') {
      baseNavigation.splice(3, 0,
        { id: 'caretakers', name: 'Caretakers', icon: Users },
        { id: 'finances', name: 'Finances', icon: DollarSign },
        { id: 'reports', name: 'Reports', icon: FileText }
      );
    } else if (userRole === 'caretaker' && caretakerPermissions) {
      const filteredNavigation = baseNavigation.filter(item =>
        caretakerPermissions[item.id as keyof typeof caretakerPermissions] === true
      );

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

      const scannerIndex = filteredNavigation.findIndex(item => item.id === 'scanner');
      if (scannerIndex !== -1) {
        filteredNavigation.splice(scannerIndex, 0, ...ownerFeatures);
      } else {
        filteredNavigation.push(...ownerFeatures);
      }

      return filteredNavigation;
    }

    return baseNavigation;
  };

  const navigation = getNavigation();

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-lg
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'}
        lg:translate-x-0
        ${isOpen ? 'lg:w-64' : 'lg:w-20'}
        hidden lg:block
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={isOpen ? onClose : onOpen}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5 text-gray-600" /> : <Menu className="h-5 w-5 text-gray-600" />}
        </button>

        {isOpen && (
          <div className="flex items-center flex-1 ml-2">
            <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap">LivestockPro</h2>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onTabChange(item.id);
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeTab === item.id
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'text-gray-700 hover:bg-gray-100'}
                    ${!isOpen ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`${isOpen ? 'mr-3' : ''} h-5 w-5`} />
                  <span className={`${!isOpen ? 'hidden' : 'inline'}`}>{item.name}</span>
                  {!isOpen && (
                    <span className="sr-only">{item.name}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
