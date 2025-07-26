import React from 'react';
import { 
  BarChart3, 
  Users, 
  Activity, 
  DollarSign, 
  Camera,
  Settings,
  FileText
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
      { id: 'goats', name: 'Goats', icon: Users },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden shadow-lg">
      <div className={`flex justify-around items-center h-16 px-2 ${navigation.length <= 4 ? 'max-w-2xl mx-auto' : ''}`}>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[72px] px-2 py-1 rounded-lg transition-all duration-200 ${
                activeTab === item.id
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className={`p-1.5 rounded-full ${activeTab === item.id ? 'bg-emerald-100' : ''}`}>
                <Icon className={`h-5 w-5 ${activeTab === item.id ? 'stroke-2' : ''}`} />
              </div>
              <span className="text-xs font-medium mt-1">{item.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
