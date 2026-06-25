/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/portal/**/*.{js,ts,jsx,tsx}",
    "./src/components/PortalLayout.tsx",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Tắt reset CSS để bảo tồn Vanilla CSS của website
  }
}
