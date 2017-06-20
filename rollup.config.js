// rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';

export default {
  entry: 'src/services/qix/index.js',
  dest: 'dist/qix.js',
  moduleName: 'enigma',
  format: 'umd',
  sourceMap: true,
  plugins: [
    resolve({ jsnext: true, preferBuiltins: false }),
    nodeGlobals(),
    nodeBuiltins(),
    commonjs(),
    babel({ exclude: 'node_modules/**', presets: ['es2015-rollup'], babelrc: false, plugins: ['external-helpers'] }),
    uglify(),
    filesize(),
  ],
};
