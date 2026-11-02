import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07050C",
          900: "#0B0812",
          850: "#110D1B",
          800: "#161021",
          700: "#1E1731",
          600: "#2A2142",
          500: "#3A2F58",
        },
        ember: {
          400: "#FF9A4D",
          500: "#FF7A18",
          600: "#F2610A",
        },
        plum: {
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#A855F7",
          600: "#7C3AED",
        },
        gold: {
          300: "#FFE29A",
          400: "#FFD166",
          500: "#F5B93B",
        },
        mist: {
          DEFAULT: "#F1ECFF",
          muted: "#A79FBC",
          dim: "#7C7492",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 60px -12px rgba(168,85,247,0.55)",
        ember: "0 10px 40px -12px rgba(255,122,24,0.6)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        eq: {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.6s ease both",
        eq: "eq 1.1s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
