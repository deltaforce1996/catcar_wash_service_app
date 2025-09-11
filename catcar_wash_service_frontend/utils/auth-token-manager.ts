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
    return (
      localStorage.getItem("auth_token") ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZmI5ZzdxMDAwMDR1MmdnZWhzcWZzYzciLCJlbWFpbCI6InN1cGVyYWRtaW5AY2F0Y2Fyd2FzaC5jb20iLCJuYW1lIjoi4LiZ4Liy4Lii4Liq4Lih4Lie4LiH4Lip4LmMIOC4nOC4ueC5ieC4lOC4ueC5geC4peC4o-C4sOC4muC4muC4q-C4peC4seC4gSIsInBlcm1pc3Npb24iOnsiaWQiOiJjbWZiOWc3ZzAwMDAwdTJnZzBwZnE5Mm4zIiwibmFtZSI6IkFETUlOIn0sInN0YXR1cyI6IkFDVElWRSIsImlhdCI6MTc1NzYxNjAzMjA3NiwiZXhwIjoxNzU3NjE2NjM2ODc2fQ.1EqqsSt8WaPOhsLpC60tF1vCehZPdf0LdGWGiU33IwA"
    );
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
