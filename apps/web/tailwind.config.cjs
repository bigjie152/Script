/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"]
      },
      colors: {
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        panel: "var(--color-panel)",
        panelStrong: "var(--color-panel-strong)",
        accent: "var(--color-accent)",
        accentSoft: "var(--color-accent-soft)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(10, 20, 30, 0.08)",
        glass: "0 12px 40px rgba(10, 20, 30, 0.12)"
      },
      borderRadius: {
        xl2: "1.25rem"
      }
    }
  },
  plugins: []
};
