// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import license from 'rollup-plugin-license';
import extend from 'extend';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const createConfig = (overrides) => {
  const config = {
    output: {
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve({ preferBuiltins: false }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      license({
        banner: `
        ${pkg.name} v${pkg.version}
        Copyright (c) ${new Date().getFullYear()} QlikTech International AB
        This library is licensed under MIT - See the LICENSE file for full details
      `,
      }),
    ],
  };
  extend(true, config, overrides);
  if (process.env.NODE_ENV === 'production') {
    config.output.file = config.output.file.replace('.js', '.min.js');
    config.plugins.push(terser());
  }
  return config;
};

const enigma = createConfig({
  input: 'src/enigma.js',
  output: {
    file: 'enigma.js',
    name: 'enigma',
  },
});

const senseUtilities = createConfig({
  input: 'src/sense-utilities.js',
  output: {
    file: 'sense-utilities.js',
    name: 'senseUtilities',
  },
});

const errorCodes = createConfig({
  input: 'src/error-codes.js',
  output: {
    file: 'error-codes.js',
    name: 'error-codes',
    sourcemap: false,
  },
});

export default [enigma, senseUtilities, errorCodes];
