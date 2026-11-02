export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0810",
          900: "#0f0d18",
          800: "#161323",
          700: "#221d32",
          600: "#2e2743",
        },
        parchment: "#f5e7b8",
        gold: { DEFAULT: "#c9a227", bright: "#e8c547" },
        blood: { DEFAULT: "#a83232", bright: "#d94444" },
        mana: { DEFAULT: "#5b6ee1", bright: "#7a8aff" },
        forest: "#2d6a4f",
        emerald: "#40916c",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "monospace"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0 0 rgba(0,0,0,0.8)",
        "pixel-sm": "2px 2px 0 0 rgba(0,0,0,0.8)",
      },
      borderRadius: { none: "0" },
    },
  },
  plugins: [],
};