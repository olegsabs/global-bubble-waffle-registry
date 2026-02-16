import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        batter: {
          50: "#fff9ef",
          100: "#fff0cf",
          200: "#ffe4a1",
          300: "#ffd06b",
          400: "#ffb947",
          500: "#f89c21",
          600: "#dd7f16",
          700: "#b55f14",
          800: "#934b16",
          900: "#783f16"
        },
        ink: "#231a0c"
      },
      boxShadow: {
        focus: "0 0 0 3px rgba(248, 156, 33, 0.35)"
      },
      fontFamily: {
        sans: ["Avenir Next", "Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Cooper Std", "Rockwell", "Avenir Next", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
