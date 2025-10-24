<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :permanent="$vuetify.display.lgAndUp"
      :temporary="$vuetify.display.mdAndDown"
      color="surface"
      class="border-e"
      width="280"
    >
      <!-- Logo Section -->
      <v-sheet class="py-6 px-4 text-center border-b" color="transparent">
        <img
          src="/Logo/Asset 33@2x.png"
          alt="CAT CARWASH Logo"
          style="height: 60px; width: auto; max-width: 100%"
        >
        <img
          v-if="!theme.global.current.value.dark"
          src="/Logo/Asset gray text.png"
          alt="CAT CARWASH Logo gray text"
          style="height: 60px; width: auto; max-width: 100%"
        >
        <img
          v-else
          src="/Logo/Asset 1@3x.png"
          alt="CAT CARWASH Logo white text"
          style="height: 60px; width: auto; max-width: 100%"
        >
      </v-sheet>

      <!-- Navigation Menu -->
      <v-list nav class="px-4">
        <v-list-subheader class="text-uppercase font-weight-bold text-caption text-on-surface-variant mb-2">
          หลัก
        </v-list-subheader>

        <v-list-item
          v-for="item in mainMenuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          class="mb-1"
          rounded="lg"
          color="primary"
        />

        <template v-if="managementMenuItems.length > 0">
          <v-divider class="my-4" />

          <v-list-subheader class="text-uppercase font-weight-bold text-caption text-on-surface-variant mb-2">
            จัดการ
          </v-list-subheader>

          <v-list-item
            v-for="item in managementMenuItems"
            :key="item.title"
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            class="mb-1"
            rounded="lg"
            color="primary"
          />
        </template>
      </v-list>

      <!-- Profile Section at Bottom -->
      <template #append>
        <v-sheet class="border-t" color="surface-container-low">
          <v-list>
            <v-list-item
              :prepend-avatar="profileData.avatar"
              :title="profileData.name"
              :subtitle="profileData.email"
              class="pa-4"
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
                    <v-list-item
                      prepend-icon="mdi-brightness-6"
                      title="สลับธีม"
                      @click="toggleTheme"
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
        </v-sheet>
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
      <div class="d-flex align-center ga-2">
        <img
          src="/Logo/Asset 33@2x.png"
          alt="CAT CARWASH Logo"
          style="height: 32px; width: auto"
        >
        <img
          v-if="!theme.global.current.value.dark"
          src="/Logo/Asset gray text.png"
          alt="CAT CARWASH Logo gray text"
          style="height: 24px; width: auto"
        >
        <img
          v-else
          src="/Logo/Asset 1@3x.png"
          alt="CAT CARWASH Logo white text"
          style="height: 24px; width: auto"
        >
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
          <v-list-item
            prepend-icon="mdi-brightness-6"
            title="สลับธีม"
            @click="toggleTheme"
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

// All available menu items
const allMainMenuItems = [
  {
    title: "แดชบอร์ดยอดขาย",
    icon: "mdi-view-dashboard",
    to: "/dashboard",
    roles: ["USER", "TECHNICIAN", "ADMIN"],
  },
  {
    title: "จัดการอุปกรณ์",
    icon: "mdi-hammer-wrench",
    to: "/device-management",
    roles: ["USER", "TECHNICIAN", "ADMIN"],
  },
];

const allManagementMenuItems = [
  {
    title: "จับคู่อุปกรณ์",
    icon: "mdi-link-variant",
    to: "/device-pairing",
    roles: ["TECHNICIAN", "ADMIN"],
  },
  {
    title: "จัดการลูกค้า",
    icon: "mdi-account-group",
    to: "/customer-management",
    roles: ["TECHNICIAN", "ADMIN"],
  },
  {
    title: "จัดการพนักงาน",
    icon: "mdi-account-tie",
    to: "/employee-management",
    roles: ["ADMIN"],
  },
];

// Filtered menu items based on user role
const mainMenuItems = computed(() => {
  if (!user.value) return [];
  const userRole = user.value.permission.name;
  return allMainMenuItems.filter((item) => item.roles.includes(userRole));
});

const managementMenuItems = computed(() => {
  if (!user.value) return [];
  const userRole = user.value.permission.name;
  return allManagementMenuItems.filter((item) => item.roles.includes(userRole));
});

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
/* Theme-specific gradient backgrounds */
.v-theme--dark .v-navigation-drawer {
  background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
}

.v-theme--light .v-navigation-drawer {
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
}
</style>
