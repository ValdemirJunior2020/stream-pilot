import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pilot: {
          50: "#eff6ff",
          100: "#dbeafe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          950: "#020617"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(96, 165, 250, 0.4), 0 0 40px rgba(37, 99, 235, 0.25)"
      }
    }
  },
  plugins: []
} satisfies Config;
