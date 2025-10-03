
import { ref, computed } from "vue";
import type { AuthenticatedUser } from "~/services/apis/auth-api.service";
import { AuthApiService } from "~/services/apis/auth-api.service";
import type { ApiErrorResponse } from "~/types";
import { authTokenManager } from "~/utils/auth-token-manager";

// Global state
const user = ref<AuthenticatedUser | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const authApi = new AuthApiService();

// Computed
const isAuthenticated = computed(() => !!user.value);
const isUser = computed(() => user.value?.permission.name === "USER");
const isEmployee = computed(() => user.value?.permission.name === "EMP");
const isAdmin = computed(() => user.value?.permission.name === "ADMIN");

/**
 * Simple Authentication Composable
 */
export const useAuth = () => {
  // Login
  const login = async (
    email: string,
    password: string,
    role: "USER" | "EMP" = "USER"
  ) => {
    try {
      isLoading.value = true;
      error.value = null;
      successMessage.value = null;

      const response = await authApi.login({ email, password, role });

      if (response.success && response.data) {
        authTokenManager.setToken(response.data.token);
        await fetchUser();
        successMessage.value = "เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ";
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      console.error("Login failed Axios Error:", errorAxios);
      error.value = errorAxios.message || "Login failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch user data
  const fetchUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        user.value = response.data;
        authTokenManager.setUser(response.data);
      }
    } catch {
      logout();
    }
  };

  // Logout
  const logout = () => {
    authTokenManager.clearAll();
    user.value = null;
    error.value = null;
    successMessage.value = null;
  };

  // Check permission
  const hasRole = (role: string) => user.value?.permission.name === role;

  // Initialize on app start
  const init = async () => {
    if (authTokenManager.hasToken()) {
      // Try to load user data from localStorage first
      const storedUser = authTokenManager.getUser();
      if (storedUser) {
        user.value = storedUser;
      }
      // Always fetch fresh user data from API to ensure it's up-to-date
      await fetchUser();
    }
  };

  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    successMessage: readonly(successMessage),

    // Computed
    isAuthenticated,
    isUser,
    isEmployee,
    isAdmin,

    // Methods
    login,
    logout,
    hasRole,
    init,
  };
};
