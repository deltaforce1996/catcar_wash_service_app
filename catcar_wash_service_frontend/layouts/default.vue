<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="$vuetify.display.lgAndUp"
      :temporary="$vuetify.display.mdAndDown"
      color="surface"
      class="navigation-drawer"
      width="280"
    >
      <!-- Logo Section -->
      <div class="logo-section">
        <img
          src="/Logo/Asset 33@2x.png"
          alt="CAT CARWASH Logo"
          class="nav-logo"
        />
        <img
          v-if="!theme.global.current.value.dark"
          src="/Logo/Asset gray text.png"
          alt="CAT CARWASH Logo gray text"
          class="nav-logo"
        />
        <img
          v-else
          src="/Logo/Asset 1@3x.png"
          alt="CAT CARWASH Logo white text"
          class="nav-logo"
        />
      </div>

      <!-- Navigation Menu -->
      <v-list nav class="nav-list">
        <v-list-subheader class="nav-subheader"> หลัก </v-list-subheader>

        <v-list-item
          v-for="item in mainMenuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          class="nav-item"
          color="primary"
        />

        <v-divider class="my-4" />

        <v-list-subheader class="nav-subheader"> จัดการ </v-list-subheader>

        <v-list-item
          v-for="item in managementMenuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          class="nav-item"
          color="primary"
        />

        <v-divider class="my-4" />

        <!-- Theme Toggle -->
        <v-list-item
          prepend-icon="mdi-brightness-6"
          title="สลับธีม"
          class="nav-item"
          @click="toggleTheme"
        />
      </v-list>

      <!-- Profile Section at Bottom -->
      <template #append>
        <div class="profile-section">
          <v-list>
            <v-list-item
              :prepend-avatar="profileData.avatar"
              :title="profileData.name"
              :subtitle="profileData.email"
              class="profile-item"
            >
              <template #append>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item
                      prepend-icon="mdi-account-outline"
                      title="โปรไฟล์"
                      @click="goToProfile"
                    />
                    <v-divider />
                    <v-list-item
                      prepend-icon="mdi-logout"
                      title="ออกจากระบบ"
                      @click="handleLogout"
                    />
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Mobile App Bar -->
    <v-app-bar
      v-if="$vuetify.display.mdAndDown"
      color="surface"
      elevation="1"
      height="64"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-spacer />

      <!-- Mobile Logo -->
      <div class="mobile-logo-container">
        <img
          src="/Logo/Asset 33@2x.png"
          alt="CAT CARWASH Logo"
          class="mobile-logo"
        />
        <img
          v-if="!theme.global.current.value.dark"
          src="/Logo/Asset gray text.png"
          alt="CAT CARWASH Logo gray text"
          class="mobile-logo-text"
        />
        <img
          v-else
          src="/Logo/Asset 1@3x.png"
          alt="CAT CARWASH Logo white text"
          class="mobile-logo-text"
        />
      </div>

      <v-spacer />

      <!-- Profile Menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" icon size="large">
            <v-avatar size="32">
              <v-img :src="profileData.avatar" />
            </v-avatar>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-account-outline"
            title="โปรไฟล์"
            @click="goToProfile"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-logout"
            title="ออกจากระบบ"
            @click="logout"
          />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main Content -->
    <v-main>
      <v-container class="mt-4">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useTheme } from "vuetify";
import { useAuth } from "~/composables/useAuth";

// Theme management
const theme = useTheme();
const { logout, user, init } = useAuth();

onMounted(async () => {
  await init();
});

// Navigation drawer state
const drawer = ref(true);

// Profile data computed from user data
const profileData = computed(() => {
  if (!user.value) {
    return {
      name: "คุณผู้ใช้งาน",
      email: "คุณผู้ใช้งาน@คุณผู้ใช้งาน.com",
      avatar: "/Character/character cat-02.png",
    };
  }

  if ("fullname" in user.value) {
    return {
      name: user.value.fullname,
      email: user.value.email,
      avatar: "/Character/character cat-02.png",
    };
  } else {
    return {
      name: user.value.name,
      email: user.value.email,
      avatar: "/Character/character cat-02.png",
    };
  }
});

// Main menu items
const mainMenuItems = [
  {
    title: "แดชบอร์ดยอดขาย",
    icon: "mdi-view-dashboard",
    to: "/dashboard",
  },
  {
    title: "จัดการอุปกรณ์",
    icon: "mdi-hammer-wrench",
    to: "/device-management",
  },
];

// Management menu items
const managementMenuItems = [
  {
    title: "จัดการลูกค้า",
    icon: "mdi-account-group",
    to: "/customer-management",
  },
  {
    title: "จัดการพนักงาน",
    icon: "mdi-account-tie",
    to: "/employee-management",
  },
  {
    title: "จับคู่อุปกรณ์",
    icon: "mdi-link-variant",
    to: "/device-pairing",
  },
];

// Methods
const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
};

const goToProfile = () => {
  navigateTo("/profile");
};

const _goToSettings = () => {
  navigateTo("/settings");
};

const handleLogout = () => {
  logout();
  navigateTo("/login");
};
</script>

<style scoped>
.navigation-drawer {
  border-right: 1px solid rgb(var(--v-theme-outline));
}

.logo-section {
  padding: 1.5rem 1rem;
  text-align: center;
  border-bottom: 1px solid rgb(var(--v-theme-outline));
}

.nav-logo {
  height: 60px;
  width: auto;
  max-width: 100%;
}

.nav-list {
  padding: 0 1rem;
}

.nav-subheader {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.nav-item {
  margin-bottom: 0.25rem;
  color: rgb(var(--v-theme-on-surface));
}

.nav-item:hover {
  background-color: rgb(var(--v-theme-surface-variant));
}

.nav-item.router-link-active {
  background: linear-gradient(
    45deg,
    rgba(255, 152, 0, 0.1) 30%,
    rgba(255, 87, 34, 0.1) 90%
  );
  color: #ff9800;
  border-left: 3px solid #ff9800;
}

.profile-section {
  border-top: 1px solid rgb(var(--v-theme-outline));
  background-color: rgb(var(--v-theme-surface-container-low));
}

.profile-item {
  padding: 1rem;
}

.mobile-logo-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-logo {
  height: 32px;
  width: auto;
}

.mobile-logo-text {
  height: 24px;
  width: auto;
}

/* Theme-specific styles */
.v-theme--dark .navigation-drawer {
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
}

.v-theme--light .navigation-drawer {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .logo-section {
    padding: 1rem 0.75rem;
  }

  .nav-logo {
    height: 50px;
  }

  .nav-list {
    padding: 0 0.75rem;
  }
}
</style>
