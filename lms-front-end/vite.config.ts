import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Add the server proxy block here
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'https://odel-lms-api.nsuk.edu.ng',
  //       changeOrigin: true,
  //       secure: false, 
  //     },
  //     '/auth': {
  //       target: 'https://odel-lms-api.nsuk.edu.ng',
  //       changeOrigin: true,
  //       secure: false,
  //     }
  //   }
  // }
})