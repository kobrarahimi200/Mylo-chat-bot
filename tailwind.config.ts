import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12131a",
        canvas: "#f7f7f4",
        accent: "#635bff",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(18, 19, 26, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
