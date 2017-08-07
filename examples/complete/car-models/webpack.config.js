/* eslint-env node */

const path = require('path');

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/app'),
  },
  output: {
    filename: 'app.js',
    publicPath: 'http://localhost:8080/',
  },
  debug: true,
  devtool: 'source-map',
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      exclude: [path.resolve(__dirname, 'node_modules')],
      query: {
        presets: ['es2015'],
        plugins: ['transform-exponentiation-operator'],
      },
    }],
  },
};
