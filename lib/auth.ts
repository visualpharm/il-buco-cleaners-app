// This is a simple auth utility that can be expanded later
export const isAuthenticated = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').find(row => row.startsWith('isAuthenticated=')) === 'isAuthenticated=true';
};

export const signIn = (): void => {
  if (typeof document === 'undefined') return;
  // Set cookie to expire in 7 days
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie = `isAuthenticated=true; expires=${expires.toUTCString()}; path=/`;
  window.location.href = '/analytics';
};

export const signOut = (): void => {
  if (typeof document === 'undefined') return;
  // Set cookie to expire in the past
  document.cookie = 'isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  window.location.href = '/';
};
