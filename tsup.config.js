export default {
  entryPoints: ['src/stdio.ts', 'src/prepare-docs/prepare.ts', 'src/prepare-docs/auto-init.js'],
  format: ['esm'],
  treeshake: 'smallest',
  splitting: true,
  target: 'es2022',
  clean: true,
}; 