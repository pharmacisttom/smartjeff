import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        brand: {
          50: "var(--brand-50)",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "#065f46",
          900: "#064e3b",
        },
        surface: {
          bg: "var(--bg)",
          subtle: "var(--bg-subtle)",
          elevated: "var(--bg-elevated)",
          border: "var(--border)",
        },
        content: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        semantic: {
          success: "var(--success)",
          warning: "var(--warning)",
          danger: "var(--danger)",
          info: "var(--info)",
        }
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
      },
    },
  },
  plugins: [],
};
export default config;
