/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        scroll: "scroll 30s linear infinite",
      },
      textShadow: {
        default: "0 2px 4px rgba(0,0,0,0.10)",
        lg: "0 2px 10px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0,0,0,0.4)",
        },
        ".text-shadow-lg": {
          textShadow: "0 2px 10px rgba(0,0,0,0.7)",
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
