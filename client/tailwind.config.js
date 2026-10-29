/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 500: "#7c3aed", 600: "#6d28d9", 700: "#5b21b6", 900: "#2e1065" },
      },
      boxShadow: { card: "0 4px 24px -8px rgba(91,33,182,0.18)" },
    },
  },
  plugins: [],
};
