import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      // Miniflare options
      bindings: {},
      kvNamespaces: [],
      durableObjects: {},
    },
  },
  esbuild: {
    target: 'es2022',
  },
});
