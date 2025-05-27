import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        test: 'test.html', 
        singleDay: 'single-day.html',
        library: "library.html"
      }
    }
  }
});
