/**
 * FORGE Auth Utilities
 * Centralized authentication helpers for FORGE SaaS
 * Version: 1.3.0
 * Date: January 2026
 * 
 * Requires: Supabase JS client loaded first
 * 
 * Provides:
 * - Session management
 * - User authentication checks
 * - Organization ID retrieval
 * - Subscription status checks
 */

const ForgeAuth = (function() {
  'use strict';

  // ============================================
  // CONFIGURATION - Environment Detection
  // ============================================
  const ENV_CONFIG = {
    // Production
    'forgehq.app': {
      url: 'https://fcvsadmwtdfvapdmpcsv.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdnNhZG13dGRmdmFwZG1wY3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NzU4NDcsImV4cCI6MjA4MDM1MTg0N30.XOGN7LQmVksy1BheoBRJ8LvtNoEBAww4wnbewHwJu7o'
    },
    // Dev (Cloudflare preview)
    'dev.forge-saas.pages.dev': {
      url: 'https://jlsqhjmyidplbianuhzh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsc3Foam15aWRwbGJpYW51aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTU0OTQsImV4cCI6MjA4MTM3MTQ5NH0.Al4evxdYbn1fn8P9NLJsd1IzMkslK0ks8cwGEE1Wc_4'
    },
    // Local development
    'localhost': {
      url: 'https://jlsqhjmyidplbianuhzh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsc3Foam15aWRwbGJpYW51aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTU0OTQsImV4cCI6MjA4MTM3MTQ5NH0.Al4evxdYbn1fn8P9NLJsd1IzMkslK0ks8cwGEE1Wc_4'
    },
    // 127.0.0.1 (alternate localhost)
    '127.0.0.1': {
      url: 'https://jlsqhjmyidplbianuhzh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impsc3Foam15aWRwbGJpYW51aHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3OTU0OTQsImV4cCI6MjA4MTM3MTQ5NH0.Al4evxdYbn1fn8P9NLJsd1IzMkslK0ks8cwGEE1Wc_4'
    }
  };

  // Detect environment from hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const config = ENV_CONFIG[hostname] || ENV_CONFIG['localhost'];
  const SUPABASE_URL = config.url;
  const SUPABASE_ANON_KEY = config.key;
  
  // Log which environment is active
  console.log('ForgeAuth: Environment detected as', hostname, '-> Supabase:', SUPABASE_URL.split('//')[1].split('.')[0]);

  // ============================================
  // INITIALIZATION
  // ============================================
  // Initialize Supabase client
  // Assumes supabase.createClient is available globally
  let supabaseClient = null;
  
  // Session ready state - prevents race condition where getSession() is called
  // before Supabase has restored the session from localStorage (TRN-606)
  let sessionReady = false;
  let sessionReadyResolve = null;
  const sessionReadyPromise = new Promise(resolve => {
    sessionReadyResolve = resolve;
  });

  try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('ForgeAuth: Supabase client initialized');

      // Set up timeout - if INITIAL_SESSION never fires, proceed anyway after 5 seconds
      const sessionTimeout = setTimeout(() => {
        if (!sessionReady) {
          console.warn('ForgeAuth: INITIAL_SESSION timeout after 5s, proceeding without session');
          sessionReady = true;
          sessionReadyResolve(null);
        }
      }, 5000);

      // Listen for INITIAL_SESSION event - this fires when Supabase has finished
      // restoring the session from localStorage
      supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') {
          clearTimeout(sessionTimeout);
          sessionReady = true;
          sessionReadyResolve(session);
          console.log('ForgeAuth: INITIAL_SESSION received, session ready');
        }
      });
    } else {
      console.error('ForgeAuth: Supabase JS client not loaded. Please include Supabase JS before this script.');
      // Mark session as ready (with null) so getSession() doesn't hang
      sessionReady = true;
      sessionReadyResolve(null);
    }
  } catch (error) {
    console.error('ForgeAuth: Failed to initialize Supabase client', error);
    // Mark session as ready (with null) so getSession() doesn't hang
    sessionReady = true;
    sessionReadyResolve(null);
  }

  // ============================================
  // CACHE
  // ============================================
  // Cache organization_id to avoid repeated queries
  let cachedOrgId = null;
  let cachedOrgIdUserId = null; // Track which user the cache belongs to
  let cachedPlatformRole = null;
  let cachedPlatformRoleUserId = null;

  // ============================================
  // PRIVATE HELPERS
  // ============================================
  
  /**
   * Get Supabase client (throws if not initialized)
   */
  function getClient() {
    if (!supabaseClient) {
      throw new Error('ForgeAuth: Supabase client not initialized. Ensure Supabase JS is loaded first.');
    }
    return supabaseClient;
  }

  /**
   * Clear all caches when user changes
   */
  function clearCache() {
    cachedOrgId = null;
    cachedOrgIdUserId = null;
    cachedPlatformRole = null;
    cachedPlatformRoleUserId = null;
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get current session (returns null if not logged in)
   * Waits for INITIAL_SESSION event before checking, to prevent race condition (TRN-606)
   * @returns {Promise<Object|null>} Session object or null
   */
  async function getSession() {
    try {
      // Wait for Supabase to finish restoring session from localStorage
      if (!sessionReady) {
        console.log('ForgeAuth.getSession: Waiting for INITIAL_SESSION...');
        await sessionReadyPromise;
      }

      const client = getClient();
      const { data, error } = await client.auth.getSession();

      if (error) {
        console.error('ForgeAuth.getSession: Error fetching session', error);
        return null;
      }

      return data.session;
    } catch (error) {
      console.error('ForgeAuth.getSession: Exception', error);
      return null;
    }
  }

  /**
   * Get current user object
   * @returns {Promise<Object|null>} User object or null
   */
  async function getUser() {
    const session = await getSession();
    return session ? session.user : null;
  }

  /**
   * Check if user is authenticated, redirect to login if not
   * @param {string} redirectUrl - URL to redirect to if not authenticated (default: '/login')
   * @returns {Promise<Object|null>} User object if authenticated, null if redirected
   */
  async function requireAuth(redirectUrl = '/login') {
    const user = await getUser();
    
    if (!user) {
      console.log('ForgeAuth.requireAuth: No user found, redirecting to', redirectUrl);
      window.location.href = redirectUrl;
      return null;
    }
    
    return user;
  }

  /**
   * Sign out and redirect to login
   * @param {string} redirectUrl - URL to redirect to after sign out (default: '/login')
   * @returns {Promise<void>}
   */
  async function signOut(redirectUrl = '/login') {
    try {
      const client = getClient();
      const { error } = await client.auth.signOut();
      
      if (error) {
        console.error('ForgeAuth.signOut: Error signing out', error);
        // Still redirect even if sign out fails
      } else {
        console.log('ForgeAuth.signOut: Signed out successfully');
      }
      
      // Clear cache
      clearCache();
      
      // Redirect to login
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('ForgeAuth.signOut: Exception', error);
      // Still redirect on error
      window.location.href = redirectUrl;
    }
  }

  /**
   * Get user's organization ID (from profiles table)
   * Caches result to avoid repeated queries
   * @returns {Promise<string|null>} Organization ID or null
   */
  async function getOrgId() {
    try {
      const user = await getUser();
      
      if (!user || !user.id) {
        console.log('ForgeAuth.getOrgId: No user found');
        return null;
      }
      
      // Check cache
      if (cachedOrgId && cachedOrgIdUserId === user.id) {
        console.log('ForgeAuth.getOrgId: Returning cached organization_id', cachedOrgId);
        return cachedOrgId;
      }
      
      // Query profiles table (fetch both organization_id and platform_role)
      const client = getClient();
      const { data, error } = await client
        .from('profiles')
        .select('organization_id, platform_role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('ForgeAuth.getOrgId: Error fetching organization_id', error);
        return null;
      }
      
      if (!data || !data.organization_id) {
        console.warn('ForgeAuth.getOrgId: No organization_id found for user', user.id);
        return null;
      }
      
      // Cache both results
      cachedOrgId = data.organization_id;
      cachedOrgIdUserId = user.id;
      
      // Also cache platform_role if we got it
      if (data.platform_role) {
        cachedPlatformRole = data.platform_role;
        cachedPlatformRoleUserId = user.id;
      }
      
      console.log('ForgeAuth.getOrgId: Retrieved organization_id', cachedOrgId);
      return cachedOrgId;
      
    } catch (error) {
      console.error('ForgeAuth.getOrgId: Exception', error);
      return null;
    }
  }

  /**
   * Get user's subscription status
   * @returns {Promise<Object|null>} Subscription object or null
   */
  async function getSubscription() {
    try {
      const orgId = await getOrgId();
      
      if (!orgId) {
        console.log('ForgeAuth.getSubscription: No org_id found');
        return null;
      }
      
      // Query subscriptions table
      const client = getClient();
      const { data, error } = await client
        .from('subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .single();
      
      if (error) {
        // Not an error if no subscription exists (new org)
        if (error.code === 'PGRST116') {
          console.log('ForgeAuth.getSubscription: No subscription found for org', orgId);
          return null;
        }
        console.error('ForgeAuth.getSubscription: Error fetching subscription', error);
        return null;
      }
      
      console.log('ForgeAuth.getSubscription: Retrieved subscription', data);
      return data;
      
    } catch (error) {
      console.error('ForgeAuth.getSubscription: Exception', error);
      return null;
    }
  }

  /**
   * Check if subscription is active (not expired)
   * Active if: status === 'active' OR (status === 'trialing' AND trial_ends_at > now)
   * @returns {Promise<boolean>} True if subscription is active
   */
  async function isSubscriptionActive() {
    try {
      const subscription = await getSubscription();
      
      if (!subscription) {
        console.log('ForgeAuth.isSubscriptionActive: No subscription found');
        return false;
      }
      
      // Check if status is 'active'
      if (subscription.status === 'active') {
        console.log('ForgeAuth.isSubscriptionActive: Subscription is active');
        return true;
      }
      
      // Check if status is 'trialing' and trial hasn't ended
      if (subscription.status === 'trialing' && subscription.trial_ends_at) {
        const trialEndsAt = new Date(subscription.trial_ends_at);
        const now = new Date();
        
        if (trialEndsAt > now) {
          console.log('ForgeAuth.isSubscriptionActive: Trial is active until', trialEndsAt);
          return true;
        } else {
          console.log('ForgeAuth.isSubscriptionActive: Trial has expired');
          return false;
        }
      }
      
      console.log('ForgeAuth.isSubscriptionActive: Subscription is not active (status:', subscription.status + ')');
      return false;
      
    } catch (error) {
      console.error('ForgeAuth.isSubscriptionActive: Exception', error);
      return false;
    }
  }

  /**
   * Get user's platform role (from profiles table)
   * Caches result to avoid repeated queries
   * @returns {Promise<string|null>} Platform role ('user', 'admin', 'super_admin') or null
   */
  async function getPlatformRole() {
    try {
      const user = await getUser();
      
      if (!user || !user.id) {
        console.log('ForgeAuth.getPlatformRole: No user found');
        return null;
      }
      
      // Check cache
      if (cachedPlatformRole && cachedPlatformRoleUserId === user.id) {
        console.log('ForgeAuth.getPlatformRole: Returning cached platform_role', cachedPlatformRole);
        return cachedPlatformRole;
      }
      
      // Query profiles table
      const client = getClient();
      const { data, error } = await client
        .from('profiles')
        .select('platform_role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('ForgeAuth.getPlatformRole: Error fetching platform_role', error);
        return null;
      }
      
      // Default to 'user' if not set
      const role = data?.platform_role || 'user';
      
      // Cache result
      cachedPlatformRole = role;
      cachedPlatformRoleUserId = user.id;
      
      console.log('ForgeAuth.getPlatformRole: Retrieved platform_role', cachedPlatformRole);
      return cachedPlatformRole;
      
    } catch (error) {
      console.error('ForgeAuth.getPlatformRole: Exception', error);
      return null;
    }
  }

  /**
   * Check if current user is a super admin
   * @returns {Promise<boolean>} True if user is super_admin
   */
  async function isSuperAdmin() {
    const role = await getPlatformRole();
    return role === 'super_admin';
  }

  /**
   * Check if current user is an admin or super admin
   * @returns {Promise<boolean>} True if user is admin or super_admin
   */
  async function isAdmin() {
    const role = await getPlatformRole();
    return role === 'admin' || role === 'super_admin';
  }

  // ============================================
  // EXPORT
  // ============================================
  return {
    getSession,
    getUser,
    requireAuth,
    signOut,
    getOrgId,
    getSubscription,
    isSubscriptionActive,
    getPlatformRole,
    isSuperAdmin,
    isAdmin
  };

})();

// Export as global
window.ForgeAuth = ForgeAuth;
