import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          DEFAULT: "#0A1F3D",
          deep: "#071733",
        },
        cyan: {
          DEFAULT: "#6EE7E0",
          dim: "#3E93A0",
        },
        amber: {
          DEFAULT: "#F0A83C",
        },
        paper: {
          DEFAULT: "#F6F8FB",
          dim: "#EDF1F7",
        },
        ink: {
          DEFAULT: "#0E1B2E",
          soft: "#59677E",
        },
        line: "#DDE4EE",
        grid: "rgba(110,231,212,0.14)",
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "IBM Plex Sans", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      backgroundImage: {
        "blueprint-grid":
          "linear-gradient(var(--tw-grid-line,rgba(110,231,212,0.14)) 1px, transparent 1px), linear-gradient(90deg, var(--tw-grid-line,rgba(110,231,212,0.14)) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "44px 44px",
        "grid-sm": "36px 36px",
      },
      boxShadow: {
        panel: "0 24px 60px -30px rgba(10,31,61,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
