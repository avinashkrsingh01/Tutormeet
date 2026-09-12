import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ─── Color Palette ──────────────────────────────────────────────────────
      colors: {
        // Primary — Deep Navy (trust, authority, professionalism)
        navy: {
          50:  "#eef2f9",
          100: "#d6e0f2",
          200: "#b0c3e8",
          300: "#7fa0d8",
          400: "#5079c4",
          500: "#2f57ad",
          600: "#1e3f8f",
          700: "#173274",
          800: "#122860",
          900: "#0d1e4a",
          950: "#070f2b",
        },

        // Secondary — Professional Blue (interactive, CTAs)
        blue: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },

        // Accent — Teal/Green (trust, growth, verified)
        teal: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },

        // Neutral — Warm gray (backgrounds, borders, muted text)
        neutral: {
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },

        // Semantic aliases used throughout the app
        brand: {
          50:  "#eef2f9",
          100: "#d6e0f2",
          200: "#b0c3e8",
          300: "#7fa0d8",
          400: "#5079c4",
          500: "#2f57ad",
          600: "#1e3f8f",
          700: "#173274",
          800: "#122860",
          900: "#0d1e4a",
          950: "#070f2b",
        },

        accent: {
          50:  "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },

        // Surface colors
        surface: {
          DEFAULT: "#ffffff",
          subtle:  "#fafafa",
          muted:   "#f5f5f5",
          raised:  "#ffffff",
        },
      },

      // ─── Typography ──────────────────────────────────────────────────────────
      fontFamily: {
        sans:    ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },

      // ─── Spacing ─────────────────────────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
      },

      // ─── Border Radius ───────────────────────────────────────────────────────
      borderRadius: {
        "xs":  "0.25rem",
        "sm":  "0.375rem",
        DEFAULT: "0.5rem",
        "md":  "0.625rem",
        "lg":  "0.75rem",
        "xl":  "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      // ─── Shadows ─────────────────────────────────────────────────────────────
      boxShadow: {
        // Soft elevation system — no harsh drop shadows
        "xs":    "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        "sm":    "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        DEFAULT: "0 2px 8px 0 rgb(0 0 0 / 0.07), 0 1px 3px -1px rgb(0 0 0 / 0.05)",
        "md":    "0 4px 12px -1px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)",
        "lg":    "0 8px 24px -3px rgb(0 0 0 / 0.09), 0 4px 10px -4px rgb(0 0 0 / 0.06)",
        "xl":    "0 16px 40px -6px rgb(0 0 0 / 0.10), 0 8px 16px -8px rgb(0 0 0 / 0.06)",
        "2xl":   "0 24px 60px -8px rgb(0 0 0 / 0.12)",
        // Colored glows for active/hover states
        "navy":  "0 4px 20px -2px rgb(14 30 74 / 0.20)",
        "teal":  "0 4px 20px -2px rgb(13 148 136 / 0.25)",
        "inner": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        "none":  "none",
      },

      // ─── Transitions ─────────────────────────────────────────────────────────
      transitionDuration: {
        "75":  "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "500": "500ms",
      },

      // ─── Animation ───────────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        "scale-in": "scale-in 0.15s ease-out",
        shimmer:    "shimmer 1.8s infinite linear",
      },

      // ─── Background Size ─────────────────────────────────────────────────────
      backgroundSize: {
        "200%": "200%",
      },
    },
  },
  plugins: [],
};

export default config;
