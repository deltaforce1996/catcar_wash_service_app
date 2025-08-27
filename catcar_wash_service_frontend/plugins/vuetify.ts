// import this after install `@mdi/font` package
import "@mdi/font/css/materialdesignicons.css";

import "vuetify/styles";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: "dark",
      themes: {
        light: {
          dark: false,
          colors: {
            primary: "#f57f2a",
            "primary-darken-1": "#e56b1a",
            secondary: "#ff9800",
            "secondary-darken-1": "#f57c00",
            accent: "#ffc107",
            error: "#f44336",
            warning: "#ff9800",
            info: "#2196f3",
            success: "#4caf50",
            surface: "#ffffff",
            "surface-bright": "#ffffff",
            "surface-light": "#f5f5f5",
            "surface-variant": "#f0f0f0",
            "surface-container": "#fafafa",
            "surface-container-low": "#f8f8f8",
            "surface-container-lowest": "#ffffff",
            "on-surface": "#1c1b1f",
            "on-surface-variant": "#49454f",
          },
        },
        dark: {
          dark: true,
          colors: {
            primary: "#f57f2a",
            "primary-darken-1": "#e56b1a",
            secondary: "#ff9800",
            "secondary-darken-1": "#f57c00",
            accent: "#ffc107",
            error: "#cf6679",
            warning: "#ff9800",
            info: "#2196f3",
            success: "#81c784",
            surface: "#121212",
            "surface-bright": "#2a2a2a",
            "surface-light": "#1e1e1e",
            "surface-variant": "#2c2c2c",
            "surface-container": "#1a1a1a",
            "surface-container-low": "#161616",
            "surface-container-lowest": "#0f0f0f",
            "on-surface": "#e6e1e5",
            "on-surface-variant": "#cac4cf",
          },
        },
      },
    },
    display: {
      mobileBreakpoint: "md",
      thresholds: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
        xxl: 2560,
      },
    },
    defaults: {
      VBtn: {
        style: "text-transform: none;",
      },
    },
  });
  app.vueApp.use(vuetify);
});
