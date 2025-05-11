import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // Main entry point
        test: 'test.html', // Add any additional HTML pages
        singleDay: 'single-day.html'  // Another example
      }
    }
  }
});
