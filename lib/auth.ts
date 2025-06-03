// Simple auth utility for cleaning app
export const isAuthenticated = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').find(row => row.startsWith('auth=')) === 'auth=true';
};

export const signIn = (password?: string): boolean => {
  if (typeof document === 'undefined') return false;
  
  // Simple password check - in production, use proper authentication
  const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  
  if (password && password === correctPassword) {
    // Set cookie to expire in 24 hours
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);
    document.cookie = `auth=true; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
    return true;
  }
  
  return false;
};

export const signOut = (): void => {
  if (typeof document === 'undefined') return;
  // Clear auth cookie
  document.cookie = 'auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  window.location.href = '/';
};

// Server-side auth check
export const isAuthenticatedServer = (cookieHeader?: string): boolean => {
  if (!cookieHeader) return false;
  return cookieHeader.includes('auth=true');
};
