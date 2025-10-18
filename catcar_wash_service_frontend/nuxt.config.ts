import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  build: {
    transpile: ["vuetify"],
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error - Vite plugin types are not fully compatible with Vuetify
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
    "@nuxt/eslint",
    "@pinia/nuxt",
  ],
  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
      apiTimeout: process.env.NUXT_PUBLIC_API_TIMEOUT,
      apiRetryAttempts: process.env.NUXT_PUBLIC_API_RETRY_ATTEMPTS,
      apiRetryDelay: process.env.NUXT_PUBLIC_API_RETRY_DELAY,
      debugEnabled: process.env.NUXT_PUBLIC_DEBUG_ENABLED,
      logLevel: process.env.NUXT_PUBLIC_LOG_LEVEL,
      appName: process.env.NUXT_PUBLIC_APP_NAME,
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION,
    },
  },
  ssr: false,
  devServer: {
    port: 3001,
    host: "0.0.0.0",
  },
});
