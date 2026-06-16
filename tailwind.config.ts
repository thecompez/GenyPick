import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070811",
          900: "#090A14",
          850: "#101322",
          800: "#151A2E",
          700: "#202744"
        },
        geny: {
          cyan: "#33D6FF",
          blue: "#366BFF",
          violet: "#8B5CF6",
          lime: "#A7F950",
          gold: "#F9D15C"
        }
      },
      boxShadow: {
        glow: "0 0 36px rgba(51, 214, 255, 0.16)",
        violet: "0 0 42px rgba(139, 92, 246, 0.2)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
