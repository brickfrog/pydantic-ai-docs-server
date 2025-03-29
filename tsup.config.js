export default {
  entryPoints: ['src/stdio.ts'],
  format: ['esm'],
  treeshake: 'smallest',
  splitting: true,
  target: 'es2022',
  clean: true,
}; 