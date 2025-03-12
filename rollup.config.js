const terser = require('@rollup/plugin-terser');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');

const moduleName = 'CustomPromise';
const regex = new RegExp(`^((?!${moduleName}).)*$`);
module.exports = {
  input: ['src/index.js'],
  output: {
    file: 'dist/polyfill.js',
    format: 'umd',
    name: moduleName,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    terser({
      mangle: {
        properties: {
          // Регулярное выражение для исключения свойства CustomPromise
          regex, // Исключает CustomPromise из минификации
        },
      },
      compress: {
        properties: true, // Минифицировать свойства объектов
      },
    }),
  ],
};
