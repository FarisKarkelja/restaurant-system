import { defineConfig } from 'vite'

export default defineConfig({
  root: 'frontend',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'frontend/index.html',
        register: 'frontend/pages/register.html',
        menu: 'frontend/pages/menu.html',
        admin: 'frontend/pages/admin.html',
      },
    },
  },
})
