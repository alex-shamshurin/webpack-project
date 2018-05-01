import { resolve as pathResolve } from 'path';
import appRootDir from 'app-root-dir';
import pkg from '../package.json';

// const webpack = require('webpack');
// const pathArr = __dirname.split(path.sep);
// const projectName = pathArr[pathArr.length - 1];
// const buildPath = `${__dirname}${path.sep}${projectName}${path.sep}build`;
//

const ROOT_DIR = appRootDir.get();
const SRC_DIR = pathResolve(ROOT_DIR, 'src');
const BUILD_DIR = pathResolve(ROOT_DIR, 'build');

const reScript = /\.(js|jsx|mjs)$/;
const reStyle = /\.(css|less|styl|scss|sass|sss)$/;
const reImage = /\.(bmp|gif|jpg|jpeg|png|svg)$/;

const configFactory = mode => {
  const isDebug = process.NODE_ENV === 'development';
  const staticAssetName = isDebug
    ? '[path][name].[ext]?[hash:8]'
    : '[hash:8].[ext]';
  const isVerbose = process.argv.includes('--verbose');
  const isAnalyze =
    process.argv.includes('--analyze') || process.argv.includes('--analyse');

  const config = {
    context: ROOT_DIR,
    entry: pathResolve(SRC_DIR, 'index.js'),
    output: {
      path: BUILD_DIR,
      pathinfo: isVerbose,
      filename: 'bundle.js',
      devtoolModuleFilenameTemplate: info =>
        path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
    },
    resolve: {
      modules: ['node_modules', 'src']
    },
    mode: isDebug ? 'development' : 'production',
    module: {
      rules: [
        {
          test: reScript,
          include: [SRC_DIR, pathResolve('tools')],
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            cacheDirectory: isDebug,
            babelrc: false,
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    browsers: pkg.browserslist,
                    forceAllTransforms: !isDebug // UglifyJS
                  },
                  modules: false,
                  useBuiltIns: false,
                  debug: false
                }
              ],
              ['@babel/preset-stage-2', { decoratorsLegacy: true }],
              '@babel/preset-flow',
              ['@babel/preset-react', { development: true }]
            ],
            plugins: [
              ...(isDebug ? [] : ['@babel/transform-react-constant-elements']),
              ...(isDebug ? [] : ['@babel/transform-react-inline-elements']),
              ...(isDebug ? [] : ['transform-react-remove-prop-types']),
              'react-hot-loader/babel'
            ]
          }
        }
      ]
    }
  };

  if (mode === 'development') {
    return config;
  }
  return config;
};

module.exports = configFactory;
