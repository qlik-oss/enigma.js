// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
// import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';
import license from 'rollup-plugin-license';
import extend from 'extend';

const pkg = require('./package.json');

const createConfig = (overrides) => {
  const config = {
    output: {
      format: 'umd',
      sourcemap: true,
    },
    plugins: [
      resolve({ jsnext: true, preferBuiltins: false }),
      // nodeGlobals() is disabled right now due to a bug: https://github.com/calvinmetcalf/rollup-plugin-node-globals/issues/9
      // nodeGlobals(),
      nodeBuiltins(),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        externalHelpers: true,
      }),
      license({
        banner: `
        ${pkg.name} v${pkg.version}
        Copyright (c) ${new Date().getFullYear()} QlikTech International AB
        This library is licensed under MIT - See the LICENSE file for full details
      `,
      }),
      filesize(),
    ],
  };
  extend(true, config, overrides);
  if (process.env.NODE_ENV === 'production') {
    config.output.file = config.output.file.replace('.js', '.min.js');
    config.plugins.push(uglify());
  }
  return config;
};

const enigma = createConfig({
  input: 'src/qix.js',
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

export default [enigma, senseUtilities];
