import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  splitting: false,
  target: 'es2020',
  external: ['react', 'react-dom', '@feedvalue/core'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  // Add 'use client' banner for Next.js App Router compatibility
  banner: {
    js: "'use client';",
  },
});
