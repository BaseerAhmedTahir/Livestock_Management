import React from 'react';
import { Menu, Bell, User, BarChart3, Settings, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessSelector } from '../Business/BusinessSelector';

interface HeaderProps {
  title: string;
  onTabChange?: (tab: string) => void;
  onViewAllBusinesses?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onTabChange, onViewAllBusinesses }) => {
  const { user, signOut } = useAuth();
  const { healthRecords, goats } = useApp();
  const { userRole } = useBusiness();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  // ✅ Compute notifications safely
  const notifications = React.useMemo(() => {
    const now = new Date();
    return healthRecords
      .filter(record => record.nextDueDate && record.nextDueDate > now)
      .sort((a, b) => (a.nextDueDate?.getTime() || 0) - (b.nextDueDate?.getTime() || 0))
      .slice(0, 5)
      .map(record => {
        const goat = goats.find(g => g.id === record.goatId);
        const daysUntilDue = Math.ceil(((record.nextDueDate?.getTime() || 0) - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: record.id,
          message: `${goat?.tagNumber || 'Unknown'} - ${record.type} due in ${daysUntilDue} days`,
          type: daysUntilDue <= 3 ? 'warning' : 'info',
          time: format(record.nextDueDate!, 'MMM dd, yyyy')
        };
      });
  }, [healthRecords, goats]);

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
    setShowNotifications(false);
  };

  return (
    <header className="glass-effect shadow-soft border-b border-neutral-200 dark:border-neutral-700 px-3 sm:px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between w-full">
        {/* Left Section: Logo */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-medium">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-neutral-100 hidden sm:block">LivestockPro</h1>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 hidden lg:block truncate max-w-48">{title}</p>
            </div>
          </div>
        </div>

        {/* Middle Section: BusinessSelector (takes all available space) */}
        <div className="flex-1 min-w-0 mx-2 sm:mx-4">
          <BusinessSelector onViewAllBusinesses={onViewAllBusinesses} />
        </div>

        {/* Right Section: Notifications & Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="touch-target p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-300 hover:scale-110 active:scale-95 relative"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-600 dark:text-neutral-400" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse shadow-medium">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 glass-effect rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 animate-slide-down">
                <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-700">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-hide">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                      <p className="text-sm text-neutral-900 dark:text-neutral-100">{notification.message}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{notification.time}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                      <p className="text-sm">No upcoming due dates</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 sm:p-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700/50 rounded-b-2xl">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                      Notifications based on upcoming health record due dates
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="flex items-center space-x-1 sm:space-x-2 touch-target p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all duration-300 hover:scale-105 active:scale-95"
              aria-label="Open user menu"
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm text-neutral-700 dark:text-neutral-300">
                {user?.email?.split('@')[0]}
              </span>
              {userRole && (
                <span className="hidden md:inline text-xs text-neutral-500 dark:text-neutral-400 capitalize">({userRole})</span>
              )}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-effect rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 animate-slide-down">
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.email}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                    {userRole === 'owner' ? 'Business Owner' : 'Caretaker'} Account
                  </p>
                </div>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      onTabChange?.('settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};