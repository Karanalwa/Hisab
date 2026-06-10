import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        ink: "#0f172a",
        muted: "#64748b",
        surface: "#f8fafc",
        line: "#e2e8f0",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
      },
      boxShadow: {
        card: "0 1px 3px rgba(15,23,42,.04), 0 1px 2px rgba(15,23,42,.06)",
        "card-hover": "0 4px 12px rgba(15,23,42,.06), 0 2px 4px rgba(15,23,42,.04)",
        soft: "0 2px 8px rgba(15,23,42,.05)",
        md2: "0 6px 20px rgba(15,23,42,.08)",
      },
      borderRadius: {
        xl2: "16px",
        "2xl2": "20px",
      },
    },
  },
  plugins: [],
};
export default config;
