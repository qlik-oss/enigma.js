const path = require('path');
const Webpack = require('webpack');

const srcDir = path.resolve(__dirname, 'src');
const entryPoint = path.resolve(srcDir, 'index');
const outputPath = path.resolve(__dirname, 'dist');

function createConfig(isDebug) {
  const config = {
    entry: entryPoint,
    output: {
      path: outputPath,
      filename: `enigma${isDebug ? '' : '.min'}.js`,
      library: 'enigma',
      libraryTarget: 'umd',
    },
    module: {
      loaders: [{
        test: /\.js$/,
        include: [srcDir],
        exclude: /node_modules/,
        loader: 'babel',
      }],
    },
    devtool: 'source-map',
    plugins: [
      new Webpack.NormalModuleReplacementPlugin(/superagent|q/, (result) => {
        if (result.request === 'superagent') {
          result.request = 'empty-module';
        }
      }),
    ],
  };

  if (isDebug) {
    config.debug = true;
  } else {
    config.plugins.push(new Webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
    }));
  }

  return config;
}

module.exports = [true, false].map(createConfig);
