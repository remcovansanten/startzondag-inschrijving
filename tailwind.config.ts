import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors - darkened for better contrast
        primary: "#c73e2b",      // Darker GKE red (WCAG AA compliant)
        "primary-hover": "#a02f1f", // Even darker for hover
        "primary-light": "#e94b35", // Original color for backgrounds only
        
        // Text colors with good contrast
        "text-dark": "#1f2937",  // Very dark gray (better than #333)
        "text-muted": "#4b5563", // Medium gray (replaces gray-600)
        "text-light": "#6b7280", // Light gray (minimum for AA compliance)
        
        // Background colors
        secondary: "#f5f5f5",    // Light gray background
        "bg-light": "#f9fafb",   // Very light gray
        
        // Status colors - optimized for contrast
        success: "#047857",      // Darker green for text
        "success-bg": "#d1fae5", // Light green for backgrounds
        danger: "#b91c1c",       // Darker red for text  
        "danger-bg": "#fee2e2",  // Light red for backgrounds
        warning: "#b45309",      // Darker amber for text
        "warning-bg": "#fef3c7", // Light amber for backgrounds
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;