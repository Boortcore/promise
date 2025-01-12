const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

module.exports = {
  input: ['src/index.js'],
  output: {
    file: 'dist/polyfill.js',
    format: 'umd',
    name: 'Promise',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    terser({
      mangle: {
        properties: true,
      },
    }),
  ],
};
