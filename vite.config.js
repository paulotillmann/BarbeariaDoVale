import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Porta fixa 5173 em IPv4 — combina com a tool servidor-dev.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: "127.0.0.1" },
})
