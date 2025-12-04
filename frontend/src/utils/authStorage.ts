/**
 * Utility functions for managing authentication tokens across storage mechanisms
 * This ensures tokens are accessible across tabs/windows and persist properly
 */

/**
 * Get the authentication token from either localStorage or sessionStorage
 * Priority: sessionStorage (more secure, tab-specific) > localStorage (persistent, cross-tab)
 */
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Check sessionStorage first (for session-only logins)
    const sessionToken = sessionStorage.getItem('authToken');
    if (sessionToken) {
      return sessionToken;
    }
    
    // Check localStorage (for "Remember Me" persistent logins and Google OAuth)
    // localStorage is shared across tabs/windows, so tokens stored here persist across new windows
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      // Sync to sessionStorage so apiRequest can use it consistently
      // This ensures the token is available for API calls in this tab
      try {
        sessionStorage.setItem('authToken', localToken);
      } catch {
        // If sessionStorage is full or blocked, continue with localStorage token
        console.warn('[AUTH STORAGE] Could not sync to sessionStorage, using localStorage token only');
      }
      return localToken;
    }
  } catch (error) {
    // Handle cases where localStorage/sessionStorage might be blocked (privacy settings)
    console.error('[AUTH STORAGE] Error accessing storage:', error);
    return null;
  }
  
  return null;
};

/**
 * Store authentication token in the appropriate storage
 * @param token - The JWT token to store
 * @param rememberMe - If true, store in localStorage (persistent). If false, store in sessionStorage (session-only)
 */
export const setAuthToken = (token: string, rememberMe: boolean = false): void => {
  if (typeof window === 'undefined') return;
  
  if (rememberMe) {
    // Store in localStorage for persistent login across browser sessions
    localStorage.setItem('authToken', token);
    // Also sync to sessionStorage for immediate use in this tab
    sessionStorage.setItem('authToken', token);
  } else {
    // Store in sessionStorage for session-only login
    // Note: sessionStorage is tab-specific, so cross-tab sync won't work via storage events
    // However, we also store in localStorage to enable cross-tab access for the current browser session
    // The token in localStorage will be cleared when the user explicitly logs out
    sessionStorage.setItem('authToken', token);
    localStorage.setItem('authToken', token); // Enable cross-tab access
  }
  
  // Dispatch custom event to notify other tabs/windows of the auth state change
  // Note: localStorage 'storage' event will also fire and trigger sync in other tabs
  window.dispatchEvent(new CustomEvent('authTokenChanged', { 
    detail: { token, rememberMe } 
  }));
};

/**
 * Remove authentication token from all storage
 */
export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  
  // Dispatch custom event to notify other tabs/windows of logout
  window.dispatchEvent(new CustomEvent('authTokenChanged', { 
    detail: { token: null } 
  }));
  
};

/**
 * Check if a token exists in either storage
 */
export const hasAuthToken = (): boolean => {
  return getAuthToken() !== null;
};

