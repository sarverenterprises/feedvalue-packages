import { defineConfig } from 'tsup';

export default defineConfig([
  // ESM + CJS for bundlers (npm package)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    splitting: false,
    target: 'es2020',
    outDir: 'dist',
  },
  // IIFE for script tag usage (UMD-like)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'FeedValueCore',
    outDir: 'dist/umd',
    minify: true,
    sourcemap: true,
    target: 'es2020',
    outExtension: () => ({ js: '.min.js' }),
  },
]);
