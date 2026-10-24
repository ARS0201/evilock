/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        evilock: {
          espresso: "#3B2923",     // Dark Espresso Brown (Sidebar, major brand elements)
          coffee: "#4B342B",       // Deep Coffee (Headings, primary text)
          walnut: "#795548",       // Walnut Brown (Primary buttons, selected nav)
          caramel: "#B8875B",      // Warm Caramel (Highlights, badges, indicators)
          bronze: "#C69A6B",       // Soft Bronze (Secondary accents)
          ivory: "#F7F3EE",        // Warm Ivory (Main page background)
          cream: "#FFFDF9",        // Soft Cream (Cards, tables, forms, modals)
          beige: "#E5D7C8",        // Sand Beige (Borders, subtle dividers)
          text: "#30241F",         // Main Text
          muted: "#88776B",        // Secondary Text
          forest: "#397451",       // Forest Green (VERIFIED status, success)
          amber: "#B7791F",        // Amber (Warnings, pending reviews, legal holds)
          crimson: "#B84040",      // Muted Crimson (MISMATCH, tamper alert, errors)
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(59, 41, 35, 0.05), 0 1px 2px -1px rgba(59, 41, 35, 0.05)',
        card: '0 2px 8px -1px rgba(59, 41, 35, 0.06), 0 1px 4px -1px rgba(59, 41, 35, 0.04)',
        elevation: '0 8px 24px -4px rgba(59, 41, 35, 0.12), 0 2px 8px -2px rgba(59, 41, 35, 0.06)',
      }
    },
  },
  plugins: [],
}
