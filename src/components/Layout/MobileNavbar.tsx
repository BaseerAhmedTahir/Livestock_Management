import React from 'react';
import {
  BarChart3,
  Users,
  Activity,
  DollarSign,
  Camera,
  Settings,
  FileText,
  PawPrint
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab, onTabChange }) => {
  const { userRole, caretakerPermissions } = useBusiness();

  const getNavigation = () => {
    const baseNavigation = [
      { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
      { id: 'goats', name: 'Goats', icon: PawPrint },
      { id: 'health', name: 'Health', icon: Activity },
      { id: 'caretakers', name: 'Caretakers', icon: Users },
      { id: 'finances', name: 'Finances', icon: DollarSign },
      { id: 'reports', name: 'Reports', icon: FileText },
      { id: 'scanner', name: 'Scanner', icon: Camera },
      { id: 'settings', name: 'Settings', icon: Settings }
    ];

    if (userRole === 'caretaker' && caretakerPermissions) {
      return baseNavigation.filter(item => {
        if (item.id === 'settings') return true;
        return caretakerPermissions[item.id] === true;
      });
    }

    return baseNavigation;
  };

  const navigation = getNavigation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 lg:hidden shadow-lg z-50">
      <div className="overflow-x-auto">
        <div className="flex items-center h-16 px-2 space-x-1 min-w-max">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center min-w-[72px] px-2 py-1 rounded-lg transition-all duration-200
                  ${activeTab === item.id
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100'}
                `}
              >
                <div className={`p-1.5 rounded-full ${activeTab === item.id ? 'bg-emerald-100 dark:bg-emerald-800' : ''}`}>
                  <Icon className={`h-5 w-5 ${activeTab === item.id ? 'stroke-2' : ''}`} />
                </div>
                <span className="text-xs font-medium mt-1">{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
