import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { email, businessId, caretakerId, password } = await req.json()

    if (!email || !businessId || (!caretakerId && !password)) {
      return new Response(
        JSON.stringify({ error: caretakerId ? 'Email and businessId are required' : 'Email, businessId, and password are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Creating caretaker account for:', email, 'in business:', businessId)

    // Verify the user has permission to invite caretakers to this business
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_business_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()

    if (roleError || userRole?.role !== 'owner') {
      console.error('Authorization check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Not authorized to invite caretakers to this business' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Authorization verified for business owner:', user.id)

    // Default permissions for caretakers
    const defaultCaretakerPermissions = {
      dashboard: true,
      goats: true,
      health: true,
      scanner: true,
      settings: true,
      caretakers: false,
      finances: false,
      reports: false
    }

    // Check if user already exists by email
    const { data: existingUsers, error: existingUsersError } = await supabaseAdmin.auth.admin.listUsers()

    if (existingUsersError) {
      console.error('Error checking for existing users:', existingUsersError)
      return new Response(
        JSON.stringify({ error: `Failed to check existing users: ${existingUsersError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const existingUser = existingUsers.users?.find(u => u.email === email)
    
    if (existingUser) {
      console.log('User already exists, checking if they have access to this business')
      
      // Check if user already has access to this business
      const { data: existingRole, error: existingRoleError } = await supabaseAdmin
        .from('user_business_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('business_id', businessId)
        .maybeSingle()

      if (existingRoleError && existingRoleError.code !== 'PGRST116') {
        console.error('Error checking existing role:', existingRoleError)
        return new Response(
          JSON.stringify({ error: `Failed to check existing role: ${existingRoleError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (existingRole) {
        return new Response(
          JSON.stringify({ 
            error: `User with email ${email} already has access to this business. Please use a different email address or remove their existing access first.` 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // User exists but doesn't have access to this business - add business role
      const { error: newRoleError } = await supabaseAdmin
        .from('user_business_roles')
        .insert({
          user_id: existingUser.id,
          business_id: businessId,
          role: 'caretaker',
          linked_caretaker_id: caretakerId || null,
          permissions: defaultCaretakerPermissions
        })

      if (newRoleError) {
        console.error('Failed to create business role for existing user:', newRoleError)
        return new Response(
          JSON.stringify({ error: `Failed to grant business access: ${newRoleError.message}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Update their password to the new one provided
      const { error: passwordUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: password }
      )

      if (passwordUpdateError) {
        console.error('Failed to update password for existing user:', passwordUpdateError)
        // Don't fail the entire operation for this
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: { id: existingUser.id },
          email: email,
          password: password,
          message: 'Existing user granted access to business and password updated',
          userRole: 'caretaker',
          businessId: businessId
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the caretaker user account with permanent password
    console.log('Creating new user account...')
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Skip email confirmation
    })

    if (authError2) {
      console.error('Failed to create user account:', authError2)
      return new Response(
        JSON.stringify({ error: authError2.message }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User account created successfully:', authData.user.id)

    // Create user profile as caretaker (this is critical - must be caretaker, not owner)
    console.log('Creating user profile...')
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        role: 'caretaker'
      })

    if (profileError) {
      console.error('Failed to create caretaker profile:', profileError)
      // If profile creation fails, delete the user account
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create caretaker profile: ${profileError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully created caretaker profile for user:', authData.user.id)

    // Create business role assignment (caretaker can only access this one business)
    console.log('Creating business role assignment...')
    const { data: roleData, error: roleError2 } = await supabaseAdmin
      .from('user_business_roles')
      .insert({
        user_id: authData.user.id,
        business_id: businessId,
        role: 'caretaker',
        linked_caretaker_id: caretakerId || null,
        permissions: defaultCaretakerPermissions
      })
      .select()

    if (roleError2) {
      console.error('Failed to create business role:', roleError2)
      // If role creation fails, delete the user account
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create business role: ${roleError2.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully created business role for user:', authData.user.id, 'in business:', businessId, 'Role data:', roleData)
    
    // Verify the role was created correctly by fetching it back
    const { data: verifyRole, error: verifyError } = await supabaseAdmin
      .from('user_business_roles')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('business_id', businessId)
      .single()

    if (verifyError) {
      console.error('Failed to verify business role creation:', verifyError)
      // Clean up if verification fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Business role verification failed: ${verifyError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('Verified business role created successfully:', verifyRole)
    }

    // Double-check by fetching all roles for this user
    const { data: allUserRoles, error: allRolesError } = await supabaseAdmin
      .from('user_business_roles')
      .select('*')
      .eq('user_id', authData.user.id)

    if (allRolesError) {
      console.error('Failed to fetch all user roles:', allRolesError)
    } else {
      console.log('All roles for user after creation:', allUserRoles)
    }

    // Verify the profile was created correctly
    const { data: verifyProfile, error: verifyProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()

    if (verifyProfileError) {
      console.error('Failed to verify profile creation:', verifyProfileError)
      // Clean up if verification fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: `Profile verification failed: ${verifyProfileError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      console.log('Verified profile created successfully:', verifyProfile)
    }

    // Also link the caretaker record if provided
    if (caretakerId) {
      console.log('Linking caretaker record:', caretakerId)
      // Update the caretaker record to link it with the user account
      const { error: linkError } = await supabaseAdmin
        .from('caretakers')
        .update({ 
          email: email // Ensure the caretaker record has the correct email
        })
        .eq('id', caretakerId)
        .eq('business_id', businessId)

      if (linkError) {
        console.error('Failed to link caretaker record:', linkError)
        // Don't fail the entire operation for this
      } else {
        console.log('Successfully linked caretaker record:', caretakerId)
      }
    }

    // Final verification - fetch all data to ensure everything is set up correctly
    const { data: finalVerification, error: finalError } = await supabaseAdmin
      .from('user_business_roles')
      .select(`
        *,
        businesses!inner (*)
      `)
      .eq('user_id', authData.user.id)

    if (finalError || !finalVerification || finalVerification.length === 0) {
      console.error('Final verification failed:', finalError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Failed final verification - caretaker setup incomplete' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Final verification successful:', finalVerification)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        email: email,
        password: password,
        message: 'Caretaker account created successfully with permanent access to this business only',
        userRole: 'caretaker',
        businessId: businessId,
        verificationData: {
          businessRoles: finalVerification,
          profileCreated: !!verifyProfile,
          roleCreated: !!verifyRole,
          allUserRoles: allUserRoles || []
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in invite-caretaker function:', error)
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})