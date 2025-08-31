// import this after install `@mdi/font` package
import "@mdi/font/css/materialdesignicons.css";

import "vuetify/styles";
import { createVuetify } from "vuetify";

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    theme: {
      defaultTheme: "light",
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
            
            // Modern Surface System
            surface: "#ffffff",
            "surface-bright": "#ffffff",
            "surface-variant": "#f8fafc", // Very light blue-gray
            "surface-container": "#f1f5f9", // Light blue-gray
            "surface-container-high": "#e2e8f0", // Medium blue-gray
            "surface-container-highest": "#cbd5e1", // Darker blue-gray
            "surface-container-low": "#f8fafc", // Same as variant for consistency
            "surface-container-lowest": "#ffffff",
            
            // Modern Text Colors
            "on-surface": "#1e293b", // Dark slate gray
            "on-surface-variant": "#475569", // Medium slate gray
            "on-primary": "#ffffff",
            "on-secondary": "#ffffff",
            "on-error": "#ffffff",
            "on-warning": "#ffffff",
            "on-success": "#ffffff",
            "on-info": "#ffffff",
            
            // Additional Modern Colors
            outline: "#cbd5e1", // Light outline
            "outline-variant": "#e2e8f0", // Very light outline
            background: "#f8fafc", // Subtle background
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
            
            // Modern Dark Surface System
            surface: "#121212",
            "surface-bright": "#2a2a2a",
            "surface-light": "#1e1e1e",
            "surface-variant": "#2c2c2c",
            "surface-container": "#1a1a1a",
            "surface-container-low": "#161616",
            "surface-container-lowest": "#0f0f0f",
            
            // Modern Dark Text Colors
            "on-surface": "#e6e1e5",
            "on-surface-variant": "#cac4cf",
            "on-primary": "#ffffff",
            "on-secondary": "#ffffff", 
            "on-error": "#ffffff",
            "on-warning": "#1e293b",
            "on-success": "#1e293b",
            "on-info": "#ffffff",
            
            // Additional Dark Mode Colors
            // outline: "#475569", // Medium slate outline
            // "outline-variant": "#334155", // Dark slate outline
            // background: "#0f172a", // Very dark background
          },
        },
      },
      variations: {
        colors: ['primary', 'secondary', 'tertiary'],
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
