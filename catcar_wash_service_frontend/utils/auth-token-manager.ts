/**
 * Token Manager Utility
 * Handles token storage and retrieval for authentication
 */
export const authTokenManager = {
  /**
   * Get token from localStorage
   * @returns {string | null} The stored token or null if not found
   */
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  },

  /**
   * Set token in storage
   * @param {string} token - The token to store
   * @param {boolean} persistent - Whether to store in localStorage (true) or sessionStorage (false)
   */
  setToken: (token: string, persistent = true): void => {
    if (typeof window === "undefined") return;

    if (persistent) {
      localStorage.setItem("auth_token", token);
    } else {
      sessionStorage.setItem("auth_token", token);
    }
  },

  /**
   * Clear token from both localStorage and sessionStorage
   */
  clearToken: (): void => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_token");
  },

  /**
   * Check if token exists
   * @returns {boolean} True if token exists, false otherwise
   */
  hasToken: (): boolean => {
    return authTokenManager.getToken() !== null;
  },
};
