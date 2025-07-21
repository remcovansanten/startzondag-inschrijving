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
        primary: "#e94b35",      // GKE rood/oranje
        "primary-hover": "#d63920",
        secondary: "#f5f5f5",    // Licht grijs
        "text-dark": "#333333",  // Donker grijs voor tekst
        success: "#16a34a",
        danger: "#dc2626",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;