/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        laba: {
          bg: "#0c0c14",
          surface: "#161622",
          border: "#2d2218",
          accent: "#ff7230",
          muted: "#9e8b7b",
        },
      },
    },
  },
  plugins: [],
};
