import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  Description: "Update Tailwind config with macOS tokens, shadows, and fonts",
  Overwrite: true,
  TargetFile: "c:\\Users\\Vian_\\Videos\\2.0ant\\tailwind.config.ts",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        mac: {
          canvas: "#0b0f17",
          surface: "rgba(18, 24, 38, 0.75)",
          card: "rgba(22, 30, 46, 0.65)",
          cardHover: "rgba(28, 38, 58, 0.8)",
          subtle: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.08)",
          borderHover: "rgba(255, 255, 255, 0.15)",
          red: "#ff5f56",
          yellow: "#ffbd2e",
          green: "#27c93f",
          accent: "#10b981",
          blue: "#0a84ff",
          purple: "#bf5af2",
          amber: "#ff9f0a",
          rose: "#ff453a",
        },
        primary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#0b0f17",
        }
      },
      boxShadow: {
        'macos-window': '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'macos-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'macos-card-hover': '0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.16)',
        'macos-dock': '0 20px 40px -5px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        'macos-dropdown': '0 20px 35px -5px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
};
export default config;
