'use strict';

const webpack = require('webpack');
const path = require('path');

const version = 'v1.0.0';

const config = {
  output: {
    filename: '[name]-' + version + '.js',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    library: '[name]',
    path: path.join(__dirname, "/dist/lib")
  },
  cache: true,
  devtool: 'cheap-eval-source-map',
  entry: {
    llsWxRecorder: './src/index.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: ['babel-loader', 'eslint-loader']
    }]
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      }
    })
  ],
  externals: {
    wx: 'wx'
  }
};

if (process.env.NODE_ENV === 'production') {
  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({ minimize: true })
  );
}

module.exports = config;
