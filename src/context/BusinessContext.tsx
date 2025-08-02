import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Business, UserBusinessRole, BusinessContextType, UserProfile } from '../types';
import { CaretakerAccessError } from '../components/Business/CaretakerAccessError';

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

interface BusinessProviderProps {
  children: ReactNode;
  user: User | null;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children, user }) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusiness, setActiveBusinessState] = useState<Business | null>(null);
  const [userRole, setUserRole] = useState<'owner' | 'caretaker' | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [caretakerPermissions, setCaretakerPermissions] = useState<Record<string, boolean> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaretakerError, setShowCaretakerError] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  const { isAuthStateChanging } = useAuth();

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

  // Load businesses and user roles
  useEffect(() => {
    if (!user) {
      // Reset state when user signs out
      setBusinesses([]);
      setActiveBusinessState(null);
      setUserRole(null);
      setUserProfile(null);
      setCaretakerPermissions(null);
      setError(null);
      setShowCaretakerError(false);
      setHasLoadedInitialData(false);
      setLoading(false);
      return;
    }

    // Only load data if we haven't loaded it yet and auth state is stable
    if (!hasLoadedInitialData && !isAuthStateChanging) {
      loadBusinessData();
    }
  }, [user, hasLoadedInitialData, isAuthStateChanging]);

  const loadBusinessData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setShowCaretakerError(false);
      setCaretakerPermissions(null);

      console.log('Loading business data for user:', user.id, user.email);

      // First, fetch user's business roles to determine their role - without join to avoid issues
      const { data: existingRoles, error: rolesError } = await supabase
        .from('user_business_roles')
        .select('*, permissions')
        .eq('user_id', user.id);

      if (rolesError) {
        console.error('Error fetching user business roles:', rolesError);
        throw rolesError;
      }

      console.log('Found business roles for user:', existingRoles);

      // Determine user's primary role based on business roles
      let primaryRole: 'owner' | 'caretaker' = 'owner';
      if (existingRoles && existingRoles.length > 0) {
        // If user has any owner role, they are an owner
        // Otherwise, if they only have caretaker roles, they are a caretaker
        const hasOwnerRole = existingRoles.some(role => role.role === 'owner');
        const hasOnlyCaretakerRoles = existingRoles.every(role => role.role === 'caretaker');
        
        if (hasOwnerRole) {
          primaryRole = 'owner';
        } else if (hasOnlyCaretakerRoles) {
          primaryRole = 'caretaker';
        }
      } else {
        // If no business roles exist, check if this is a newly created caretaker
        // by checking if they have a caretaker profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile && profile.role === 'caretaker') {
          primaryRole = 'caretaker';
        }
      }

      console.log('Determined primary role:', primaryRole);

      // Now handle user profile
      let { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Create or update profile if needed
      if (!profile) {
        console.log('Creating new profile with role:', primaryRole);
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              role: primaryRole
            })
            .select()
            .single();

          if (createError) {
            // Handle unique constraint violation (profile already exists)
            if (createError.code === '23505') {
              // Fetch the existing profile
              const { data: existingProfile, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

              if (fetchError) throw fetchError;
              profile = existingProfile;
            } else {
              throw createError;
            }
          } else {
            profile = newProfile;
          }
        } catch (error) {
          throw error;
        }
      } else if (profile.role !== primaryRole) {
        // Update profile role if it doesn't match the determined role
        console.log('Updating profile role from', profile.role, 'to', primaryRole);
        const { data: updatedProfile, error: updateError } = await supabase
          .from('user_profiles')
          .update({ role: primaryRole })
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        profile = updatedProfile;
      }

      // Check if profile is still null after creation attempts
      if (!profile) {
        console.error('Failed to create or retrieve user profile');
        setLoading(false);
        return;
      }

      setUserProfile({
        id: profile.id,
        userId: profile.user_id,
        role: profile.role,
        createdAt: new Date(profile.created_at)
      });

      console.log('User business roles found:', existingRoles);
      console.log('User profile role:', profile.role);
      
      // Fetch businesses separately based on the roles
      let userBusinesses: Business[] = [];
      if (existingRoles && existingRoles.length > 0) {
        console.log('Fetching businesses for roles:', existingRoles);
        const businessIds = existingRoles.map(role => role.business_id);
        
        // For caretakers, we need to use a different approach due to RLS policies
        let businessesData;
        let businessesError;
        
        if (profile.role === 'caretaker') {
          // For caretakers, try to fetch businesses with service role or create minimal business objects
          console.log('Attempting to fetch businesses for caretaker...');
          const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .in('id', businessIds);
          
          businessesData = data;
          businessesError = error;
          
          // If RLS blocks access, create minimal business objects from role data
          if (!businessesData || businessesData.length === 0) {
            console.log('RLS blocking business access, creating minimal business objects...');
            businessesData = existingRoles.map(role => ({
              id: role.business_id,
              name: `Business ${role.business_id.substring(0, 8)}...`, // Temporary name
              description: null,
              address: 'Not specified',
              payment_model_type: 'percentage',
              payment_model_amount: 15,
              created_by_user_id: 'unknown',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }));
            businessesError = null;
            
            // Try to fetch actual business names in the background
            fetchBusinessDetails(businessIds).then(details => {
              if (details && details.length > 0) {
                console.log('Successfully fetched business details:', details);
                const updatedBusinesses = businessesData.map(business => {
                  const detail = details.find(d => d.id === business.id);
                  return detail ? { ...business, name: detail.name, description: detail.description } : business;
                });
                setBusinesses(updatedBusinesses.map(business => ({
                  id: business.id,
                  name: business.name,
                  description: business.description,
                  address: business.address || 'Not specified',
                  paymentModelType: business.payment_model_type || 'percentage',
                  paymentModelAmount: business.payment_model_amount || 15,
                  createdByUserId: business.created_by_user_id,
                  createdAt: new Date(business.created_at),
                  updatedAt: new Date(business.updated_at)
                })));
              }
            }).catch(err => {
              console.warn('Failed to fetch business details:', err);
            });
            // Try to fetch actual business names in the background
            fetchBusinessDetails(businessIds).then(details => {
              if (details && details.length > 0) {
                console.log('Successfully fetched business details:', details);
                const updatedBusinesses = businessesData.map(business => {
                  const detail = details.find(d => d.id === business.id);
                  return detail ? { ...business, name: detail.name, description: detail.description } : business;
                });
                setBusinesses(updatedBusinesses.map(business => ({
                  id: business.id,
                  name: business.name,
                  description: business.description,
                  address: business.address || 'Not specified',
                  paymentModelType: business.payment_model_type || 'percentage',
                  paymentModelAmount: business.payment_model_amount || 15,
                  createdByUserId: business.created_by_user_id,
                  createdAt: new Date(business.created_at),
                  updatedAt: new Date(business.updated_at)
                })));
              }
            }).catch(err => {
              console.warn('Failed to fetch business details:', err);
            });
          }
        } else {
          // For owners, use normal query
          const { data, error } = await supabase
            .from('businesses')
            .select('*')
            .in('id', businessIds);
          
          businessesData = data;
          businessesError = error;
        }

        if (businessesError) {
          console.error('Error fetching businesses:', businessesError);
          if (profile.role === 'owner') {
            throw businessesError;
          } else {
            console.warn('Business fetch failed for caretaker, continuing with minimal data');
            businessesData = [];
          }
        } else {
          console.log('Fetched businesses:', businessesData);
          userBusinesses = (businessesData || []).map(business => ({
            id: business.id,
            name: business.name,
            description: business.description,
            address: business.address || 'Not specified',
            paymentModelType: business.payment_model_type || 'percentage',
            paymentModelAmount: business.payment_model_amount || 15,
            createdByUserId: business.created_by_user_id,
            createdAt: new Date(business.created_at),
            updatedAt: new Date(business.updated_at)
          }));
        }
      }

      console.log('Extracted businesses:', userBusinesses);
      setBusinesses(userBusinesses);

      // If user has no business access, they need to create one (owners only)
      if (userBusinesses.length === 0 && profile.role === 'owner') {
        console.log('Owner with no businesses - will show business creation');
        setActiveBusinessState(null);
        setUserRole(null);
      } else if (userBusinesses.length === 0 && profile.role === 'caretaker') {
        console.log('Caretaker with no business access - this should not happen');
        console.log('Available roles:', existingRoles);
        console.log('Profile:', profile);
        
        // Instead of showing error, try to create a minimal business from role data
        if (existingRoles && existingRoles.length > 0) {
          console.log('Creating minimal business access for caretaker...');
          const role = existingRoles[0];
          const minimalBusiness: Business = {
            id: role.business_id,
            name: `Business Access`,
            description: 'Limited caretaker access',
            address: 'Not specified',
            paymentModelType: 'percentage',
            paymentModelAmount: 15,
            createdByUserId: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setBusinesses([minimalBusiness]);
          setActiveBusinessState(minimalBusiness);
          setUserRole('caretaker');
          
          console.log('Set minimal business access for caretaker');
        } else {
          setShowCaretakerError(true);
          setError('No business access found. Please contact the business owner who invited you.');
          setActiveBusinessState(null);
          setUserRole(null);
        }
      } else {
      // Set active business and user role
        // For caretakers, always use the first (and likely only) business they have access to
        // For owners, check stored preference
        const storedBusinessId = profile.role === 'owner' ? localStorage.getItem('activeBusiness') : null;
        let targetBusiness = userBusinesses[0];
        
        if (storedBusinessId && profile.role === 'owner') {
          const storedBusiness = userBusinesses.find(b => b.id === storedBusinessId);
          if (storedBusiness) {
            targetBusiness = storedBusiness;
          }
        }

        setActiveBusinessState(targetBusiness);
        
        // Set user role for the active business
        const userRoleForBusiness = existingRoles?.find(r => r.business_id === targetBusiness.id);
        setUserRole(userRoleForBusiness?.role || null);
        
        // If user is a caretaker, set their permissions
        if (userRoleForBusiness?.role === 'caretaker') {
          const permissions = userRoleForBusiness.permissions || getDefaultCaretakerPermissions();
          setCaretakerPermissions(permissions);
        } else {
          setCaretakerPermissions(null);
        }
        
        console.log('Set active business:', targetBusiness);
        console.log('Set user role:', userRoleForBusiness?.role);
      }

      // Mark that we've successfully loaded initial data
      setHasLoadedInitialData(true);
    } catch (error) {
      console.error('Error loading business data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fetch business details for caretakers
  const fetchBusinessDetails = async (businessIds: string[]) => {
    try {
      // Fetch business details using direct query
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, description')
        .in('id', businessIds);
      
      if (error) {
        console.warn('Failed to fetch business details:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to fetch business details:', error);
      return null;
    }
  };

  const setActiveBusiness = async (business: Business) => {
    if (!user) return;

    setActiveBusinessState(business);
    localStorage.setItem('activeBusiness', business.id);

    // Update user role for the new active business
    try {
      const { data: role } = await supabase
        .from('user_business_roles')
        .select('role, permissions')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .single();

      setUserRole(role?.role || null);
      
      // If user is a caretaker, set their permissions
      if (role?.role === 'caretaker') {
        const permissions = role.permissions || getDefaultCaretakerPermissions();
        setCaretakerPermissions(permissions);
      } else {
        setCaretakerPermissions(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const createBusiness = async (
    name: string, 
    description?: string, 
    address?: string, 
    paymentModelType: 'percentage' | 'monthly' = 'percentage', 
    paymentModelAmount: number = 15
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name,
          description: description || null,
          address: address || 'Not specified',
          payment_model_type: paymentModelType,
          payment_model_amount: paymentModelAmount,
          created_by_user_id: user.id
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Create owner role for the user
      const { error: roleError } = await supabase
        .from('user_business_roles')
        .insert({
          user_id: user.id,
          business_id: business.id,
          role: 'owner'
        });

      if (roleError) throw roleError;

      // Update local state instead of full reload
      const newBusiness: Business = {
        id: business.id,
        name: business.name,
        description: business.description,
        address: business.address || 'Not specified',
        paymentModelType: business.payment_model_type || 'percentage',
        paymentModelAmount: business.payment_model_amount || 15,
        createdByUserId: business.created_by_user_id,
        createdAt: new Date(business.created_at),
        updatedAt: new Date(business.updated_at)
      };
      
      setBusinesses(prev => [...prev, newBusiness]);
      setActiveBusinessState(newBusiness);
      setUserRole('owner');
      localStorage.setItem('activeBusiness', newBusiness.id);
    } catch (error) {
      console.error('Error creating business:', error);
      throw error;
    }
  };

  const inviteCaretaker = async (email: string, businessId: string, caretakerId?: string, password?: string) => {
    if (!user) throw new Error('User not authenticated');

    // Use provided password or generate a secure one as fallback
    const permanentPassword = password || (() => {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
      let pwd = '';
      for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return pwd;
    })();

    console.log('BusinessContext: Inviting caretaker with params:', {
      email,
      businessId,
      caretakerId,
      hasPassword: !!password
    });
    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      console.log('BusinessContext: Got session, calling edge function...');
      // Call the edge function to invite the caretaker
      const { data, error } = await supabase.functions.invoke('invite-caretaker', {
        body: {
          email,
          businessId,
          caretakerId,
          password: permanentPassword
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('BusinessContext: Edge function response:', { data, error });
      if (error) {
        // Check if the response data contains a more specific error message
        if (data?.error) {
          throw new Error(data.error);
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      if (!data?.success) throw new Error('Failed to invite caretaker');

      console.log('BusinessContext: Invitation successful, reloading business data...');
      // No need to reload business data - caretaker components will handle their own updates
      return {
        user: data.user,
        email: data.email,
        password: data.password,
        message: data.message
      };
    } catch (error) {
      console.error('Error inviting caretaker:', error);
      throw error;
    }
  };

  const deleteBusiness = async (businessId: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('Attempting to delete business:', businessId);
    console.log('Current user:', user.id);
    
    try {
      // First, verify user is the owner of this business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('created_by_user_id')
        .eq('id', businessId)
        .single();

      if (businessError) {
        console.error('Error fetching business:', businessError);
        throw new Error('Failed to verify business ownership');
      }

      if (!business || business.created_by_user_id !== user.id) {
        console.error('User is not the owner of this business');
        throw new Error('You are not authorized to delete this business. Only the business owner can delete it.');
      }

      console.log('User verified as business owner, proceeding with deletion...');

      // Delete the business (cascade will handle related data)
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)
        .eq('created_by_user_id', user.id);

      if (deleteError) {
        console.error('Error deleting business:', deleteError);
        throw new Error(`Failed to delete business: ${deleteError.message}`);
      }

      console.log('Business deleted successfully');

      // If the deleted business was the active one, clear it
      if (activeBusiness?.id === businessId) {
        setActiveBusinessState(null);
        setUserRole(null);
        localStorage.removeItem('activeBusiness');
      }

      // Update local state instead of full reload
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      
    } catch (error) {
      console.error('Error in deleteBusiness:', error);
      throw error;
    }
  };

  const updateCaretakerBusinessRolePermissions = async (userBusinessRoleId: string, newPermissions: Record<string, boolean>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('user_business_roles')
        .update({ permissions: newPermissions })
        .eq('id', userBusinessRoleId);

      if (error) throw error;

      // Update local permissions state if this affects the current user
      if (userRole === 'caretaker') {
        setCaretakerPermissions(newPermissions);
      }
    } catch (error) {
      console.error('Error updating caretaker permissions:', error);
      throw error;
    }
  };

  const updateBusinessSettings = async (businessId: string, updates: {
    name?: string;
    description?: string;
    address?: string;
    payment_model_type?: 'percentage' | 'monthly';
    payment_model_amount?: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: updates.name,
          description: updates.description,
          address: updates.address,
          payment_model_type: updates.payment_model_type,
          payment_model_amount: updates.payment_model_amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', businessId)
        .eq('created_by_user_id', user.id);

      if (error) throw error;

      // Update local state instead of full reload
      const updatedBusiness = {
        ...activeBusiness!,
        name: updates.name || activeBusiness!.name,
        description: updates.description || activeBusiness!.description,
        address: updates.address || activeBusiness!.address,
        paymentModelType: updates.payment_model_type || activeBusiness!.paymentModelType,
        paymentModelAmount: updates.payment_model_amount || activeBusiness!.paymentModelAmount,
        updatedAt: new Date()
      };
      
      setActiveBusinessState(updatedBusiness);
      setBusinesses(prev => prev.map(b => b.id === businessId ? updatedBusiness : b));
    } catch (error) {
      console.error('Error updating business settings:', error);
      throw error;
    }
  };
  const fetchCaretakerBusinessRole = async (caretakerUserId: string, businessId: string): Promise<UserBusinessRole | null> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_business_roles')
        .select('*')
        .eq('user_id', caretakerUserId)
        .eq('business_id', businessId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No role found
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        businessId: data.business_id,
        role: data.role,
        linkedCaretakerId: data.linked_caretaker_id || undefined,
        createdAt: new Date(data.created_at),
        permissions: data.permissions || getDefaultCaretakerPermissions()
      };
    } catch (error) {
      console.error('Error fetching caretaker business role:', error);
      throw error;
    }
  };

  // Alternative deletion method with more explicit checks
  const forceDeleteBusiness = async (businessId: string) => {
    if (!user) throw new Error('User not authenticated');

    console.log('Force deleting business:', businessId);
    
    try {
      // Use service role or admin privileges if available
      // First check ownership
      const { data: businesses, error: fetchError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .eq('created_by_user_id', user.id);

      if (fetchError) {
        console.error('Error fetching user businesses:', fetchError);
        throw fetchError;
      }

      const targetBusiness = businesses?.find(b => b.id === businessId);
      if (!targetBusiness) {
        throw new Error('Business not found or you do not have permission to delete it');
      }

      // Manually delete related data first to avoid constraint issues
      console.log('Deleting related data...');
      
      // Delete user business roles
      await supabase
        .from('user_business_roles')
        .delete()
        .eq('business_id', businessId);

      // Delete transactions
      await supabase
        .from('transactions')
        .delete()
        .eq('business_id', businessId);

      // Delete expenses
      await supabase
        .from('expenses')
        .delete()
        .eq('business_id', businessId);

      // Delete weight records
      await supabase
        .from('weight_records')
        .delete()
        .eq('business_id', businessId);

      // Delete health records
      await supabase
        .from('health_records')
        .delete()
        .eq('business_id', businessId);

      // Delete goats
      await supabase
        .from('goats')
        .delete()
        .eq('business_id', businessId);

      // Delete caretakers
      await supabase
        .from('caretakers')
        .delete()
        .eq('business_id', businessId);

      // Finally delete the business
      const { error: deleteError } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)
        .eq('created_by_user_id', user.id);

      if (deleteError) {
        console.error('Error deleting business:', deleteError);
        throw deleteError;
      }

      console.log('Business and all related data deleted successfully');

      // If the deleted business was the active one, clear it
      if (activeBusiness?.id === businessId) {
        setActiveBusinessState(null);
        localStorage.removeItem('activeBusiness');
      }

      // Reload business data
      setHasLoadedInitialData(false);
      await loadBusinessData();
      
    } catch (error) {
      console.error('Error in forceDeleteBusiness:', error);
      throw error;
    }
  };
  // Show caretaker error if needed
  if (showCaretakerError) {
    return <CaretakerAccessError />;
  }

  const value: BusinessContextType = {
    businesses,
    activeBusiness,
    userRole,
    setActiveBusiness,
    createBusiness,
    inviteCaretaker,
    deleteBusiness,
    caretakerPermissions,
    updateCaretakerBusinessRolePermissions,
    fetchCaretakerBusinessRole,
    updateBusinessSettings,
    loading
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};