'use strict';

const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const autoprefixer = require('autoprefixer');
const localDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

let libBaseUrl;
if (localDev) {
  libBaseUrl = './lib';
} else {
  libBaseUrl = '//cdn.llscdn.com/hybrid/lls-wx-recorder'; // ENV=production
}

const plugins = [
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.NoErrorsPlugin(),
  new webpack.DefinePlugin({
    'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    }
  }),
  new HtmlWebpackPlugin({
    template: './base.html',
    filename : '../wx.html',
    libBaseUrl
  }),
  new webpack.LoaderOptionsPlugin({
    options: {
      postcss: [autoprefixer]
    }
  })
];

if (!localDev) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }));
} else {
  plugins.push(new webpack.HotModuleReplacementPlugin());
}

module.exports = {
  output: {
    filename: '[name]-[hash].js',
    path: path.join(__dirname, "../dist/assets"),
    publicPath: localDev ? 'assets' : '//cdn.llscdn.com/hybrid/lls-wx-recorder/'
  },
  cache: true,
  devtool: 'source-map',
  entry: './index.js',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: ['babel-loader', 'eslint-loader']
    }, {
      test: /\.(css|scss)$/,
      use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']
    }]
  },
  plugins: plugins
};
