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
            // Cat Car Wash Original Theme Colors
            primary: "#f57f2a", // Original Cat Car Wash orange
            "primary-lighten-1": "#f7954a",
            "primary-lighten-2": "#faab6a",
            "primary-darken-1": "#e56b1a",
            "primary-darken-2": "#d5580a",

            // Secondary Color - Supporting Orange
            secondary: "#ff9800", // Supporting orange shade
            "secondary-lighten-1": "#ffad33",
            "secondary-lighten-2": "#ffc266",
            "secondary-darken-1": "#f57c00",
            "secondary-darken-2": "#ef6c00",

            // Accent Color - Golden Yellow
            tertiary: "#ffc107", // Golden yellow for highlights
            "tertiary-lighten-1": "#ffd54f",
            "tertiary-darken-1": "#ffb300",

            // System Colors
            error: "#ef4444", // Modern red
            "error-lighten-1": "#f87171",
            "error-darken-1": "#dc2626",

            warning: "#f59e0b", // Modern amber
            "warning-lighten-1": "#fbbf24",
            "warning-darken-1": "#d97706",

            info: "#3b82f6", // Modern blue
            "info-lighten-1": "#60a5fa",
            "info-darken-1": "#2563eb",

            success: "#10b981", // Modern green
            "success-lighten-1": "#34d399",
            "success-darken-1": "#059669",

            // Modern Surface System - Pure Gray (HSL)
            surface: "hsl(0, 0%, 98%)",
            "surface-bright": "hsl(0, 0%, 100%)",
            "surface-variant": "hsl(0, 0%, 88%)",
            "surface-container-high": "hsl(0, 0%, 93%)",
            "surface-container-highest": "hsl(0, 0%, 91%)",
            "surface-container": "hsl(0, 0%, 96%)",
            "surface-container-low": "hsl(0, 0%, 97%)",
            "surface-container-lowest": "hsl(0, 0%, 100%)",
            background: "hsl(0, 0%, 98%)",

            // Modern Text Colors - Pure Gray Palette
            "on-surface": "#2e2e2e", // Dark gray
            "on-surface-variant": "#6e6e6e", // Medium gray
            "on-primary": "#ffffff",
            "on-secondary": "#ffffff",
            "on-error": "#ffffff",
            "on-warning": "#ffffff",
            "on-success": "#ffffff",
            "on-info": "#ffffff",
          },
        },
        dark: {
          dark: true,
          colors: {
            // Cat Car Wash Original Theme Colors (Dark Mode)
            primary: "#f57f2a", // Original Cat Car Wash orange
            "primary-lighten-1": "#f7954a",
            "primary-lighten-2": "#faab6a",
            "primary-darken-1": "#e56b1a",
            "primary-darken-2": "#d5580a",

            // Secondary Color - Supporting Orange
            secondary: "#ff9800",
            "secondary-lighten-1": "#ffad33",
            "secondary-lighten-2": "#ffc266",
            "secondary-darken-1": "#f57c00",
            "secondary-darken-2": "#ef6c00",

            // Tertiary Color - Golden Accent
            tertiary: "#ffc107",
            "tertiary-lighten-1": "#ffd54f",
            "tertiary-darken-1": "#ffb300",

            // System Colors (Dark Mode Adjusted)
            error: "#f87171", // Softer red for dark mode
            "error-lighten-1": "#fca5a5",
            "error-darken-1": "#ef4444",

            warning: "#fbbf24", // Softer amber
            "warning-lighten-1": "#fde047",
            "warning-darken-1": "#f59e0b",

            info: "#60a5fa", // Softer blue
            "info-lighten-1": "#93c5fd",
            "info-darken-1": "#3b82f6",

            success: "#34d399", // Softer green
            "success-lighten-1": "#6ee7b7",
            "success-darken-1": "#10b981",

            // Modern Dark Surface System - Pure Gray (HSL)
            surface: "hsl(0, 0%, 7%)",
            "surface-bright": "hsl(0, 0%, 26%)",
            "surface-variant": "hsl(0, 0%, 28%)",
            "surface-container-highest": "hsl(0, 0%, 21%)",
            "surface-container-high": "hsl(0, 0%, 16%)",
            "surface-container": "hsl(0, 0%, 12%)",
            "surface-container-low": "hsl(0, 0%, 10%)",
            "surface-container-lowest": "hsl(0, 0%, 6%)",
            background: "hsl(0, 0%, 6%)",

            // Modern Dark Text Colors - Pure Gray
            "on-surface": "#e0e0e0",
            "on-surface-variant": "#c0c0c0",
            "on-primary": "#ffffff",
            "on-secondary": "#ffffff",
            "on-error": "#ffffff",
            "on-warning": "#1e293b",
            "on-success": "#1e293b",
            "on-info": "#ffffff",
          },
        },
      },
      variations: {
        colors: ["primary", "secondary", "tertiary"],
        lighten: 5,
        darken: 5,
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
    // defaults: {
    //   // Modern Button Defaults
    //   VBtn: {
    //     style: "text-transform: none; font-weight: 500; letter-spacing: 0.025em;",
    //     rounded: "lg",
    //     elevation: 2,
    //   },

    //   // Modern Card Defaults
    //   VCard: {
    //     rounded: "xl",
    //     elevation: 2,
    //     style: "backdrop-filter: blur(10px);",
    //   },

    //   // Modern Text Field Defaults
    //   VTextField: {
    //     rounded: "lg",
    //     variant: "outlined",
    //     density: "comfortable",
    //   },

    //   // Modern Navigation Drawer
    //   VNavigationDrawer: {
    //     rounded: "0",
    //     elevation: 0,
    //   },

    //   // Modern App Bar
    //   VAppBar: {
    //     elevation: 0,
    //     rounded: 0,
    //   },

    //   // Modern List Items
    //   VListItem: {
    //     rounded: "lg",
    //     minHeight: 48,
    //   },

    //   // Modern Chips
    //   VChip: {
    //     rounded: "lg",
    //     elevation: 1,
    //   },

    //   // Modern Dialogs
    //   VDialog: {
    //     rounded: "xl",
    //     elevation: 8,
    //   },

    //   // Modern Menu
    //   VMenu: {
    //     rounded: "lg",
    //     elevation: 6,
    //   },
    // },
  });
  app.vueApp.use(vuetify);
});
