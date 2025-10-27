
import { ref, computed } from "vue";
import type { AuthenticatedUser } from "~/services/apis/auth-api.service";
import { AuthApiService } from "~/services/apis/auth-api.service";
import { UserApiService, type UpdateUserProfilePayload } from "~/services/apis/user-api.service";
import { EmpApiService, type UpdateEmpPayload } from "~/services/apis/emp-api.service";
import type { ApiErrorResponse } from "~/types";
import { authTokenManager } from "~/utils/auth-token-manager";

// Global state
const user = ref<AuthenticatedUser | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isAuthReady = ref(false);

const authApi = new AuthApiService();
const userApi = new UserApiService();
const empApi = new EmpApiService();

// Computed
const isAuthenticated = computed(() => !!user.value);
const isUser = computed(() => user.value?.permission.name === "USER");
const isEmployee = computed(() => user.value?.permission.name === "TECHNICIAN");
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

  // Update profile based on current user data
  const updateProfile = async (profileData: UpdateUserProfilePayload | UpdateEmpPayload) => {
    try {
      isLoading.value = true;
      error.value = null;
      successMessage.value = null;

      if (!user.value || !profileData) {
        throw new Error("User not authenticated or profile data not available");
      }

      let response;

      // Update profile based on user permission using current profileData
      if (user.value.permission.name === "USER") {
        // For regular users, use UserApiService
        response = await userApi.UpdateUserProfile(profileData);
      } else if (user.value.permission.name === "TECHNICIAN" || user.value.permission.name === "ADMIN") {
        // For employees/technicians/admins, use EmpApiService
        response = await empApi.UpdateEmpProfile(profileData);
      } else {
        throw new Error("Invalid permission for profile update");
      }

      if (response.success && response.data) {
        // Update the global user state with new data
        // Cast to AuthenticatedUser to handle type compatibility
        user.value = response.data as AuthenticatedUser;
        authTokenManager.setUser(response.data as AuthenticatedUser);
        successMessage.value = "อัปเดตโปรไฟล์สำเร็จ!";
        return response.data;
      }
    } catch (err: unknown) {
      const errorAxios = err as ApiErrorResponse;
      console.error("Profile update failed:", errorAxios);
      error.value = errorAxios.message || "Profile update failed";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize on app start
  const init = async () => {
    try {
      if (authTokenManager.hasToken()) {
        // Try to load user data from localStorage first
        const storedUser = authTokenManager.getUser();
        if (storedUser) {
          user.value = storedUser;
        }
        // Always fetch fresh user data from API to ensure it's up-to-date
        await fetchUser();
      }
    } finally {
      // Mark auth as ready whether successful or not
      isAuthReady.value = true;
    }
  };

  return {
    // State
    user: readonly(user),
    isLoading: readonly(isLoading),
    error: readonly(error),
    successMessage: readonly(successMessage),
    isAuthReady: readonly(isAuthReady),

    // Computed
    isAuthenticated,
    isUser,
    isEmployee,
    isAdmin,

    // Methods
    login,
    logout,
    hasRole,
    updateProfile,
    init,
  };
};
