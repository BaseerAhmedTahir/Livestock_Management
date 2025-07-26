import React from 'react';
import { Menu, Bell, User, BarChart3, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';
import { useBusiness } from '../../context/BusinessContext';
import { BusinessSelector } from '../Business/BusinessSelector';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
  onViewAllBusinesses?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title, onViewAllBusinesses }) => {
  const { user, signOut } = useAuth();
  const { healthRecords, goats } = useApp();
  const { userRole } = useBusiness();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const notifications = React.useMemo(() => {
    const now = new Date();
    const upcomingDue = healthRecords
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

    return upcomingDue;
  }, [healthRecords, goats]);

  const handleSignOut = async () => {
    await signOut();
    setShowProfileMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200"> {/* Softer shadow */}
      {/* Main header content row */}
      <div className="max-w-7xl mx-auto px-4"> {/* Apply padding here */}
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight hidden sm:block">LivestockPro</h1>
                <p className="text-sm font-medium text-emerald-600 hidden sm:block">{title}</p>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-3 border-b border-gray-100 hover:bg-gray-50">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        Notifications based on upcoming health record due dates
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="bg-gray-100 p-1.5 rounded-full">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-tight">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs font-medium text-emerald-600 capitalize">{userRole}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <User className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                        <p className="text-xs font-medium text-emerald-600 mt-0.5 capitalize">{userRole}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center space-x-2 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Selector - Now below main header content */}
      <div className="w-full py-2 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4"> {/* Constrain and center content */}
          <BusinessSelector onViewAllBusinesses={onViewAllBusinesses} />
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
