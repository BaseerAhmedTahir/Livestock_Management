import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { supabase } from './lib/supabase';
import { AuthForm } from './components/Auth/AuthForm';
import { BusinessProvider } from './context/BusinessContext';
import { useBusiness } from './context/BusinessContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import { Business } from './types';
import { BusinessSetupPrompt } from './components/Business/BusinessSetupPrompt';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MobileNavbar } from './components/Layout/MobileNavbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { GoatList } from './components/Goats/GoatList';
import { HealthRecords } from './components/Health/HealthRecords';
import { CaretakerManagement } from './components/Caretakers/CaretakerManagement';
import { FinanceManagement } from './components/Finances/FinanceManagement';
import { QRScanner } from './components/Scanner/QRScanner';
import { Reports } from './components/Reports/Reports';
import { LoadingSpinner } from './components/UI/LoadingSpinner';
import { BusinessSettingsForm } from './components/Business/BusinessSettingsForm';
import { GlobalBusinessDashboard } from './components/Dashboard/GlobalBusinessDashboard';

function AppContent() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showGlobalDashboard, setShowGlobalDashboard] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { user, loading, signOut } = useAuth();
  const {
    activeBusiness,
    loading: businessLoading,
    setActiveBusiness,
    businesses,
    userRole,
    caretakerPermissions
  } = useBusiness();

  if (loading || businessLoading) return <LoadingSpinner />;
  if (!user) return <AuthForm />;
  if (!activeBusiness) return <BusinessSetupPrompt />;

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  if (showGlobalDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <GlobalBusinessDashboard
            onSelectBusiness={(business) => {
              setActiveBusiness(business);
              setShowGlobalDashboard(false);
            }}
            onBack={() => setShowGlobalDashboard(false)}
          />
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'goats':
        return 'Goat Management';
      case 'health':
        return 'Health Records';
      case 'caretakers':
        return 'Caretaker Management';
      case 'finances':
        return 'Financial Management';
      case 'scanner':
        return 'QR Code Scanner';
      case 'reports':
        return 'Reports & Analytics';
      case 'settings':
        return 'Settings';
      default:
        return 'LivestockPro';
    }
  };

  const renderContent = () => {
    const accessDenied = (feature: string) => (
      <div className="text-center py-12">
        <p className="text-gray-500">Access denied. You don't have permission to view {feature}.</p>
      </div>
    );

    // Render all components simultaneously, show/hide with CSS
    return (
      <div className="relative">
        {/* Dashboard */}
        <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.dashboard)) ? (
            <Dashboard onViewAllBusinesses={businesses.length > 1 ? () => setShowGlobalDashboard(true) : undefined} />
          ) : (
            accessDenied('dashboard')
          )}
        </div>

        {/* Goats */}
        <div className={activeTab === 'goats' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.goats)) ? (
            <GoatList />
          ) : (
            accessDenied('goat management')
          )}
        </div>

        {/* Health */}
        <div className={activeTab === 'health' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.health)) ? (
            <HealthRecords />
          ) : (
            accessDenied('health records')
          )}
        </div>

        {/* Caretakers */}
        <div className={activeTab === 'caretakers' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.caretakers)) ? (
            <CaretakerManagement />
          ) : (
            accessDenied('caretaker management')
          )}
        </div>

        {/* Finances */}
        <div className={activeTab === 'finances' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.finances)) ? (
            <FinanceManagement />
          ) : (
            accessDenied('finances')
          )}
        </div>

        {/* Scanner */}
        <div className={activeTab === 'scanner' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.scanner)) ? (
            <QRScanner />
          ) : (
            accessDenied('QR scanner')
          )}
        </div>

        {/* Reports */}
        <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
          {(userRole === 'owner' || (caretakerPermissions?.reports)) ? (
            <Reports />
          ) : (
            accessDenied('reports')
          )}
        </div>

        {/* Settings */}
        <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
          <div className="card animate-fade-in">
            <div className="card-header">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h2>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">Manage your account and business preferences</p>
            </div>
            <div className="card-body space-y-8">
            {/* Business Settings - Only for owners */}
            {userRole === 'owner' && (
              <BusinessSettingsForm />
            )}
            
            {/* Theme Settings */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-medium transition-all duration-300">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {!isDark ? (
                    <Moon className="w-4 h-4 text-white" />
                  ) : (
                    <Sun className="w-4 h-4 text-white" />
                  )}
                </div>
                Theme Settings
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-neutral-700 dark:text-neutral-300 font-medium">Appearance</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Choose between light and dark mode
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  {!isDark ? (
                    <>
                      <Moon className="w-4 h-4" />
                      Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4" />
                      Light Mode
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Account Information */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-medium transition-all duration-300">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Account Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Email Address</p>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">{user.email}</p>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Account Role</p>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium capitalize">{userRole}</p>
                  </div>
                  {activeBusiness && (
                    <div className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 md:col-span-2">
                      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Active Business</p>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">{activeBusiness.name}</p>
                      {activeBusiness.description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{activeBusiness.description}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-600">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        <Header
          title={getPageTitle()}
          onTabChange={setActiveTab}
          onViewAllBusinesses={businesses.length > 1 ? () => setShowGlobalDashboard(true) : undefined}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 lg:pb-6 animate-fade-in">
          <div className="max-w-7xl mx-auto px-4 py-6 dark:text-neutral-100">
            {renderContent()}
          </div>
        </main>

        <MobileNavbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <ThemeProvider>
      <BusinessProvider user={user}>
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </Router>
        </AppProvider>
      </BusinessProvider>
    </ThemeProvider>
  );
}

export default App;