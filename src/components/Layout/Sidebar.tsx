import React from 'react';
import {
  BarChart3,
  Users,
  Activity,
  DollarSign,
  Camera,
  FileText,
  Settings,
  PawPrint,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse
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
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-neutral-800 shadow-lg transition-all duration-300
        hidden lg:block ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center flex-1 min-w-0">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 whitespace-nowrap truncate">
              LivestockPro
            </h2>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          )}
        </button>
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
                  }}
                  title={isCollapsed ? item.name : undefined}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group
                    ${activeTab === item.id
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'}
                  `}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                  {isCollapsed && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </span>
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
