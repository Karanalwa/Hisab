import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        indigo: { brand: "#6366f1" },
        ink: "#1c1a3a",
        mut: "#71748f",
      },
      boxShadow: {
        soft: "0 2px 8px rgba(28,26,58,.06)",
        md2: "0 6px 20px rgba(28,26,58,.1)",
      },
    },
  },
  plugins: [],
};
export default config;
