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

    const { userId, businessId } = await req.json()

    if (!userId || !businessId) {
      return new Response(
        JSON.stringify({ error: 'userId and businessId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Deleting caretaker account for user:', userId, 'in business:', businessId)

    // Verify the requesting user has permission to delete caretakers in this business
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_business_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .single()

    if (roleError || userRole?.role !== 'owner') {
      console.error('Authorization check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete caretakers in this business' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Authorization verified for business owner:', user.id)

    // Verify the target user is a caretaker in this business
    const { data: targetUserRole, error: targetRoleError } = await supabaseAdmin
      .from('user_business_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .single()

    if (targetRoleError || targetUserRole?.role !== 'caretaker') {
      console.error('Target user role check failed:', targetRoleError)
      return new Response(
        JSON.stringify({ error: 'Target user is not a caretaker in this business' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Target user verified as caretaker:', userId)

    // Delete the user's authentication account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Failed to delete user account:', deleteError)
      return new Response(
        JSON.stringify({ error: `Failed to delete user account: ${deleteError.message}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully deleted user account:', userId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Caretaker account deleted successfully',
        deletedUserId: userId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-caretaker-account function:', error)
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})