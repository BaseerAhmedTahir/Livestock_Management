import React, { useState, useEffect } from 'react';
import { Plus, Phone, Mail, MapPin, DollarSign, Users, Edit, Trash2, UserPlus, Key, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../hooks/useAuth';
import { CaretakerForm } from '../Forms/CaretakerForm';
import { CaretakerInviteModal } from './CaretakerInviteModal';
import { Caretaker, UserBusinessRole } from '../../types';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../lib/supabase';

export const CaretakerManagement: React.FC = () => {
  const { caretakers, goats, deleteCaretaker, updateCaretaker } = useApp();
  const { user } = useAuth();
  const { inviteCaretaker, activeBusiness, updateCaretakerBusinessRolePermissions, fetchCaretakerBusinessRole } = useBusiness();
  const [selectedCaretakerId, setSelectedCaretakerId] = useState(caretakers[0]?.id || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingCaretaker, setEditingCaretaker] = useState<Caretaker | null>(null);
  const [invitingCaretaker, setInvitingCaretaker] = useState<Caretaker | null>(null);
  const [selectedCaretakerUserBusinessRole, setSelectedCaretakerUserBusinessRole] = useState<UserBusinessRole | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [isPermissionsExpanded, setIsPermissionsExpanded] = useState(true); // New state for accordion

  const selectedCaretaker = caretakers.find(c => c.id === selectedCaretakerId);
  const assignedGoats = selectedCaretaker ? goats.filter(g => g.caretakerId === selectedCaretaker.id) : [];
  const activeGoats = assignedGoats.filter(g => g.status === 'Active');
  const soldGoats = assignedGoats.filter(g => g.status === 'Sold');

  // Available tabs for permission management
  const availableTabs = [
    { id: 'dashboard', name: 'Dashboard', description: 'View business overview and statistics' },
    { id: 'goats', name: 'Goat Management', description: 'View and manage goat records' },
    { id: 'health', name: 'Health Records', description: 'View and add health records' },
    { id: 'scanner', name: 'QR Scanner', description: 'Scan QR codes for goat information' },
    { id: 'settings', name: 'Settings', description: 'Access account settings' },
    { id: 'caretakers', name: 'Caretakers', description: 'View other caretakers (owner feature)' },
    { id: 'finances', name: 'Finances', description: 'View financial data (owner feature)' },
    { id: 'reports', name: 'Reports', description: 'Generate and view reports (owner feature)' }
  ];

  // Fetch caretaker's user business role when selected caretaker changes
  useEffect(() => {
    const fetchCaretakerRole = async () => {
      if (!selectedCaretaker || !selectedCaretaker.contactInfo.email || !activeBusiness || !user) {
        setSelectedCaretakerUserBusinessRole(null);
        return;
      }

      setLoadingPermissions(true);
      try {
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        // Call the edge function to get user by email
        const { data, error } = await supabase.functions.invoke('get-user-by-email', {
          body: {
            email: selectedCaretaker.contactInfo.email,
            businessId: activeBusiness.id
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error || !data?.success) {
          setSelectedCaretakerUserBusinessRole(null);
          return;
        }

        // Use the user business role from the response
        const userBusinessRole = data.userBusinessRole;
        setSelectedCaretakerUserBusinessRole({
          id: userBusinessRole.id,
          userId: userBusinessRole.user_id,
          businessId: userBusinessRole.business_id,
          role: userBusinessRole.role,
          linkedCaretakerId: userBusinessRole.linked_caretaker_id || undefined,
          createdAt: new Date(userBusinessRole.created_at),
          permissions: userBusinessRole.permissions || getDefaultCaretakerPermissions()
        });
      } catch (error) {
        console.error('Error fetching caretaker role:', error);
        setSelectedCaretakerUserBusinessRole(null);
      } finally {
        setLoadingPermissions(false);
      }
    };

    fetchCaretakerRole();
  }, [selectedCaretaker, activeBusiness, user]);

  // Default permissions for caretakers
  const getDefaultCaretakerPermissions = (): Record<string, boolean> => ({
    dashboard: true,
    goats: true,
    health: true,
    scanner: true,
    settings: true,
    caretakers: false,
    finances: false,
    reports: false
  });

  const calculateCaretakerEarnings = (caretaker: any) => {
    const caretakerSoldGoats = goats.filter(g => g.caretakerId === caretaker.id && g.status === 'Sold');
    const profits = caretakerSoldGoats.reduce((sum, goat) => {
      if (goat.salePrice) {
        return sum + (goat.salePrice - goat.purchasePrice);
      }
      return sum;
    }, 0);

    if (caretaker.paymentModel.type === 'percentage') {
      return (profits * caretaker.paymentModel.amount) / 100;
    } else {
      return caretakerSoldGoats.length * caretaker.paymentModel.amount;
    }
  };

  const handleEditCaretaker = (caretaker: Caretaker) => {
    setEditingCaretaker(caretaker);
    setIsFormOpen(true);
  };

  const handleInviteCaretaker = (caretaker: Caretaker) => {
    setInvitingCaretaker(caretaker);
    setIsInviteModalOpen(true);
  };

  const handleDeleteCaretaker = async (caretaker: Caretaker) => {
    const assignedGoatsCount = goats.filter(g => g.caretakerId === caretaker.id).length;
    
    if (assignedGoatsCount > 0) {
      const confirmed = window.confirm(
        `${caretaker.name} has ${assignedGoatsCount} assigned goats. Deleting this caretaker will unassign all goats. Are you sure you want to continue?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${caretaker.name}? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    try {
      await deleteCaretaker(caretaker.id);
      if (selectedCaretakerId === caretaker.id) {
        setSelectedCaretakerId(caretakers.filter(c => c.id !== caretaker.id)[0]?.id || '');
      }
    } catch (error) {
      console.error('Error deleting caretaker:', error);
      alert('Failed to delete caretaker. Please try again.');
    }
  };

  const handlePermissionToggle = async (tabId: string, enabled: boolean) => {
    if (!selectedCaretakerUserBusinessRole) return;

    try {
      const updatedPermissions = {
        ...selectedCaretakerUserBusinessRole.permissions,
        [tabId]: enabled
      };

      // Update in database
      await updateCaretakerBusinessRolePermissions(selectedCaretakerUserBusinessRole.id, updatedPermissions);

      // Update local state
      setSelectedCaretakerUserBusinessRole({
        ...selectedCaretakerUserBusinessRole,
        permissions: updatedPermissions
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions. Please try again.');
    }
  };

  if (caretakers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Caretaker Management</h2>
            <p className="text-gray-600">Manage caretakers and their assigned livestock</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Caretaker
          </button>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Caretakers Added</h3>
          <p className="text-gray-600 mb-4">Add caretakers to manage and assign goats for care.</p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Add Your First Caretaker
          </button>
        </div>

        <CaretakerForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          caretaker={editingCaretaker || undefined}
          isEdit={!!editingCaretaker}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Caretaker Management</h2>
          <p className="text-gray-600">Manage caretakers and their assigned livestock</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Caretaker
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Caretakers</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {caretakers.map((ct) => {
                const ctGoats = goats.filter(g => g.caretakerId === ct.id);
                const activeCount = ctGoats.filter(g => g.status === 'Active').length;
                const hasAccount = ct.loginCredentials?.hasAccount;
                
                return (
                  <button
                    key={ct.id}
                    onClick={() => setSelectedCaretakerId(ct.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      selectedCaretakerId === ct.id ? 'bg-emerald-50 border-r-2 border-emerald-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{ct.name}</h4>
                          {hasAccount ? (
                            <CheckCircle className="h-4 w-4 text-green-500" title="Has login account" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" title="No login account" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{ct.contactInfo.phone}</p>
                        <p className="text-sm text-gray-500 mt-1">{activeCount} active goats</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-emerald-600">
                          ₹{calculateCaretakerEarnings(ct).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">earnings</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedCaretaker && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{selectedCaretaker.name}</h3>
                    <p className="text-gray-600">Caretaker Profile</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleInviteCaretaker(selectedCaretaker)}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite to System
                    </button>
                    <button 
                      onClick={() => handleEditCaretaker(selectedCaretaker)}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => handleDeleteCaretaker(selectedCaretaker)}
                      className="flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Profile Photo */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center mb-3">
                      {selectedCaretaker.photo ? (
                        <img
                          src={selectedCaretaker.photo}
                          alt={selectedCaretaker.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 text-center">{selectedCaretaker.name}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900">{selectedCaretaker.contactInfo.phone}</p>
                      </div>
                    </div>
                    
                    {selectedCaretaker.contactInfo.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{selectedCaretaker.contactInfo.email}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <Key className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Account Status</p>
                        <div className="flex items-center space-x-2">
                          {selectedCaretaker.loginCredentials?.hasAccount ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-700">Active Account</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">No Account</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-medium text-gray-900">{selectedCaretaker.contactInfo.address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedCaretaker.loginCredentials?.hasAccount && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h5 className="font-medium text-green-900 mb-1">Login Credentials</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-green-700">Email:</span>
                            <span className="font-mono text-green-800">{selectedCaretaker.loginCredentials.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-green-700">Password:</span>
                            <span className="font-mono text-green-800">{'•'.repeat(selectedCaretaker.loginCredentials.password.length)}</span>
                          </div>
                          {selectedCaretaker.loginCredentials.lastLogin && (
                            <div className="flex justify-between">
                              <span className="text-green-700">Last Login:</span>
                              <span className="text-green-800">{selectedCaretaker.loginCredentials.lastLogin.toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Payment Model</p>
                        <p className="font-medium text-gray-900">
                          {selectedCaretaker.paymentModel.type === 'percentage' 
                            ? `${selectedCaretaker.paymentModel.amount}% of profit`
                            : `₹${selectedCaretaker.paymentModel.amount} per goat`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Assigned Goats</p>
                        <p className="font-medium text-gray-900">{assignedGoats.length} total</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium text-gray-900">{format(selectedCaretaker.createdAt, 'MMM yyyy')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Permissions Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => setIsPermissionsExpanded(!isPermissionsExpanded)}
                >
                  <div className="flex items-center"> {/* Added a div for flexible spacing */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Tab Permissions</h3>
                      <p className="text-sm text-gray-600">Control which sections this caretaker can access</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {loadingPermissions && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 mr-2"></div>
                    )}
                    {isPermissionsExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {isPermissionsExpanded && ( // Conditionally render content
                  <div className="mt-4">
                    {!selectedCaretaker.contactInfo.email || !selectedCaretakerUserBusinessRole ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Key className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="font-medium text-gray-900 mb-2">No Account Access</h4>
                        <p className="text-gray-600 text-sm mb-4">
                          This caretaker doesn't have a system account yet. Create an account first to manage permissions.
                        </p>
                        <button
                          onClick={() => handleInviteCaretaker(selectedCaretaker)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableTabs.map((tab) => {
                          const isEnabled = selectedCaretakerUserBusinessRole.permissions?.[tab.id] ?? false;
                          const isOwnerFeature = ['caretakers', 'finances', 'reports'].includes(tab.id);
                          
                          return (
                            <div key={tab.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{tab.name}</h4>
                                  {isOwnerFeature && (
                                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                      Owner Feature
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{tab.description}</p>
                              </div>
                              <div className="flex items-center">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => handlePermissionToggle(tab.id, e.target.checked)}
                                    className="sr-only peer"
                                    disabled={loadingPermissions}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                </label>
                                <span className="ml-3 text-sm font-medium text-gray-700">
                                  {isEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-blue-900">Permission Notes</h4>
                              <div className="mt-1 text-sm text-blue-700">
                                <ul className="list-disc list-inside space-y-1">
                                  <li>Changes take effect immediately when the caretaker refreshes their browser</li>
                                  <li>Owner features (Caretakers, Finances, Reports) should be granted carefully</li>
                                  <li>Dashboard and Settings are recommended for all caretakers</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Goats</p>
                      <p className="text-2xl font-bold text-emerald-600">{activeGoats.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Goats Sold</p>
                      <p className="text-2xl font-bold text-blue-600">{soldGoats.length}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Earnings</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₹{calculateCaretakerEarnings(selectedCaretaker).toLocaleString()}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Assigned Goats</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {assignedGoats.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No goats assigned to this caretaker.</p>
                    </div>
                  ) : (
                    assignedGoats.map((goat) => (
                      <div key={goat.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{goat.tagNumber}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{goat.tagNumber} - {goat.nickname}</h4>
                            <p className="text-sm text-gray-600">{goat.breed} • {goat.gender}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            goat.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                            goat.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {goat.status}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{goat.currentWeight}kg</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <CaretakerForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCaretaker(null);
        }}
        caretaker={editingCaretaker || undefined}
        isEdit={!!editingCaretaker}
      />

      <CaretakerInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInvitingCaretaker(null);
        }}
        caretaker={invitingCaretaker || undefined}
      />
    </div>
  );
};
