const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const miniCssExtractPlugin = require('mini-css-extract-plugin')
const pkg = require('./package.json');
const path = require('path');
// var process = require('process');

// var BUILD_ENV = process.env.BUILD_ENV;

const config = {
  entry: {
    'app': './test/index.tsx',
  },
  resolve: {
    alias: {
      '@': './',
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  output: {
    path: path.join(__dirname, '/dist'),
    filename: '[name]-' + pkg.version + '.js'
  },
  module: {
    rules: [{
      test: /\.(png|jpe?g|jpg|gif|woff|eot|ttf|svg)/,
      use: [
          // 对非文本文件采用file-loader加载
          {
              loader: "url-loader",
              options: {
                  limit: 1024 * 30, // 30KB以下的文件
                  name: "images/[name].[hash:8].[ext]",
              }
          }
      ],
  },{
      test: /\.tsx?$/,
      loader: 'awesome-typescript-loader'
    }, {
      test: /\.less$/,
      exclude: /global\.less$/,
      use: [
        miniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: true
          }
        },
        {
          loader: "postcss-loader",
          options: {
              plugins: () => [require('autoprefixer')]
          }
        },
        'less-loader']
    }, {
      test: /global\.less$/,
      use:[
        miniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            modules: false
          }
        },
        {
          loader: "postcss-loader",
          options: {
              plugins: () => [require('autoprefixer')]
          }
        },
        'less-loader',
        {
          loader: 'style-resources-loader',
          options: {
              patterns: path.resolve(__dirname,'./global.less')
          }
      }
    ]
    }]
  },
  plugins: [
    new miniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      template: 'index.html'
    })
  ],
  devServer:{
    host: process.env.HOST,
    port: 8088,
    overlay: {
      errors: true,
      warnings: true
    },
    hotOnly: true
  },
  devtool: 'source-map',
};

module.exports = config;