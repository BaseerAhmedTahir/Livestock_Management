import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/Auth/AuthForm';
import { BusinessProvider } from './context/BusinessContext';
import { useBusiness } from './context/BusinessContext';
import { AppProvider } from './context/AppContext';
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
import { GlobalBusinessDashboard } from './components/Dashboard/GlobalBusinessDashboard';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGlobalDashboard, setShowGlobalDashboard] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { activeBusiness, loading: businessLoading, setActiveBusiness, businesses, userRole, caretakerPermissions } = useBusiness();

  if (loading || businessLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthForm />;
  }

  if (!activeBusiness) {
    return <BusinessSetupPrompt />;
  }

  // Handle global dashboard view
  if (showGlobalDashboard) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    const accessDeniedMessage = (feature: string) => (
      <div className="text-center py-12">
        <p className="text-gray-500">Access denied. You don't have permission to view {feature}.</p>
      </div>
    );

    switch (activeTab) {
      case 'dashboard':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.dashboard)) 
          ? <Dashboard onViewAllBusinesses={businesses.length > 1 ? () => setShowGlobalDashboard(true) : undefined} />
          : accessDeniedMessage('dashboard');
      case 'goats':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.goats))
          ? <GoatList />
          : accessDeniedMessage('goat management');
      case 'health':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.health))
          ? <HealthRecords />
          : accessDeniedMessage('health records');
      case 'caretakers':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.caretakers))
          ? <CaretakerManagement />
          : accessDeniedMessage('caretaker management');
      case 'finances':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.finances))
          ? <FinanceManagement />
          : accessDeniedMessage('finances');
      case 'scanner':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.scanner))
          ? <QRScanner />
          : accessDeniedMessage('QR scanner');
      case 'reports':
        return (userRole === 'owner' || (caretakerPermissions && caretakerPermissions.reports))
          ? <Reports />
          : accessDeniedMessage('reports');
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                  <p className="text-gray-600">Email: {user.email}</p>
                  <p className="text-gray-600">Role: {userRole}</p>
                  {activeBusiness && (
                    <p className="text-gray-600">Business: {activeBusiness.name}</p>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={signOut}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={getPageTitle()}
          onViewAllBusinesses={businesses.length > 1 ? () => setShowGlobalDashboard(true) : undefined}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 lg:pb-6">
          <div className="max-w-7xl mx-auto px-4 py-6">
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
  const { user } = useAuth();
  
  return (
    <BusinessProvider user={user}>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BusinessProvider>
  );
}

export default App;