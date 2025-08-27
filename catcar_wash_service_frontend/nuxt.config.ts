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
});
