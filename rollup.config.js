// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import multidest from 'rollup-plugin-multi-dest';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';
import license from 'rollup-plugin-license';

const pkg = require('./package.json');

const createConfig = (overrides) => {
  const config = {
  format: 'umd',
  sourceMap: true,
  plugins: [
    resolve({ jsnext: true, preferBuiltins: false }),
    nodeGlobals(),
    nodeBuiltins(),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      // we need to disable the rc file since we need the modules support
      // to run our tests (which is disabled in rollup):
      babelrc: false,
      presets: ['es2015-rollup'],
      plugins: ['external-helpers', 'transform-object-assign'],
    }),
      filesize(),
    ],
  };
  Object.assign(config, overrides);
  return config;
};

const enigma = createConfig({
  entry: 'src/qix.js',
  dest: 'dist/enigma.js',
  moduleName: 'enigma',
});

enigma.plugins.push(multidest([{
      dest: 'dist/enigma.min.js',
      format: 'umd',
      plugins: [
        uglify(),
      ],
    }]),
    license({
      banner: `
        ${pkg.name} v${pkg.version}
        Copyright (c) ${new Date().getFullYear()} QlikTech International AB
        This library is licensed under MIT - See the LICENSE file for full details
      `,
    }),
    filesize(),
  ],
}];
