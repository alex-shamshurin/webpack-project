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
//
// CSS Nano options http://cssnano.co/
const minimizeCssOptions = {
  discardComments: { removeAll: true }
};

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
        pathResolve(info.absoluteResourcePath).replace(/\\/g, '/')
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
        },
        {
          test: reStyle,
          rules: [
            // Convert CSS into JS module
            {
              issuer: { not: [reStyle] },
              use: 'isomorphic-style-loader'
            },

            // Process external/third-party styles
            {
              exclude: SRC_DIR,
              loader: 'css-loader',
              options: {
                sourceMap: isDebug,
                minimize: isDebug ? false : minimizeCssOptions
              }
            },

            // Process internal/project styles (from src folder)
            {
              include: SRC_DIR,
              loader: 'css-loader',
              options: {
                // CSS Loader https://github.com/webpack/css-loader
                importLoaders: 1,
                sourceMap: isDebug,
                // CSS Modules https://github.com/css-modules/css-modules
                modules: true,
                localIdentName: isDebug
                  ? '[name]-[local]-[hash:base64:5]'
                  : '[hash:base64:5]',
                // CSS Nano http://cssnano.co/
                minimize: isDebug ? false : minimizeCssOptions
              }
            },

            // Apply PostCSS plugins including autoprefixer
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: './tools/postcss.config.js'
                }
              }
            }

            // Compile Less to CSS
            // https://github.com/webpack-contrib/less-loader
            // Install dependencies before uncommenting: yarn add --dev less-loader less
            // {
            //   test: /\.less$/,
            //   loader: 'less-loader',
            // },

            // Compile Sass to CSS
            // https://github.com/webpack-contrib/sass-loader
            // Install dependencies before uncommenting: yarn add --dev sass-loader node-sass
            // {
            //   test: /\.(scss|sass)$/,
            //   loader: 'sass-loader',
            // },
          ]
        },

        {
          test: reImage,
          oneOf: [
            // Inline lightweight images into CSS
            {
              issuer: reStyle,
              oneOf: [
                // Inline lightweight SVGs as UTF-8 encoded DataUrl string
                {
                  test: /\.svg$/,
                  loader: 'svg-url-loader',
                  options: {
                    name: staticAssetName,
                    limit: 4096 // 4kb
                  }
                },

                // Inline lightweight images as Base64 encoded DataUrl string
                {
                  loader: 'url-loader',
                  options: {
                    name: staticAssetName,
                    limit: 4096 // 4kb
                  }
                }
              ]
            },

            // Or return public URL to image resource
            {
              loader: 'file-loader',
              options: {
                name: staticAssetName
              }
            }
          ]
        },

        // Convert plain text into JS module
        {
          test: /\.txt$/,
          loader: 'raw-loader'
        },

        // Return public URL for all assets unless explicitly excluded
        // DO NOT FORGET to update `exclude` list when you adding a new loader
        {
          exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/],
          loader: 'file-loader',
          options: {
            name: staticAssetName
          }
        },

        // Exclude dev modules from production build
        ...(isDebug
          ? []
          : [
              {
                test: pathResolve(
                  'node_modules/react-deep-force-update/lib/index.js'
                ),
                loader: 'null-loader'
              }
            ])
      ]
    },

    // Don't attempt to continue if there are any errors.
    bail: !isDebug,
    cache: isDebug,

    // Specify what bundle information gets displayed
    // https://webpack.js.org/configuration/stats/
    stats: {
      cached: isVerbose,
      cachedAssets: isVerbose,
      chunks: isVerbose,
      chunkModules: isVerbose,
      colors: true,
      hash: isVerbose,
      modules: isVerbose,
      reasons: isDebug,
      timings: true,
      version: isVerbose
    },

    // Choose a developer tool to enhance debugging
    // https://webpack.js.org/configuration/devtool/#devtool
    devtool: isDebug ? 'cheap-module-inline-source-map' : 'source-map'
  };

  //
  // Configuration for the client-side bundle (client.js)
  // -----------------------------------------------------------------------------

  const clientConfig = {
    ...config,

    name: 'client',
    target: 'web',

    entry: {
      client: ['@babel/polyfill', './src/client.js'],
    },

    plugins: [
      // Define free variables
      // https://webpack.js.org/plugins/define-plugin/
      new webpack.DefinePlugin({
        'process.env.BROWSER': true,
        __DEV__: isDebug,
      }),

      // Emit a file with assets paths
      // https://github.com/webdeveric/webpack-assets-manifest#options
      new WebpackAssetsManifest({
        output: `${BUILD_DIR}/asset-manifest.json`,
        publicPath: true,
        writeToDisk: true,
        customize: ({ key, value }) => {
          // You can prevent adding items to the manifest by returning false.
          if (key.toLowerCase().endsWith('.map')) return false;
          return { key, value };
        },
        done: (manifest, stats) => {
          // Write chunk-manifest.json.json
          const chunkFileName = `${BUILD_DIR}/chunk-manifest.json`;
          try {
            const fileFilter = file => !file.endsWith('.map');
            const addPath = file => manifest.getPublicPath(file);
            const chunkFiles = stats.compilation.chunkGroups.reduce((acc, c) => {
              acc[c.name] = [
                ...(acc[c.name] || []),
                ...c.chunks.reduce(
                  (files, cc) => [
                    ...files,
                    ...cc.files.filter(fileFilter).map(addPath),
                  ],
                  [],
                ),
              ];
              return acc;
            }, Object.create(null));
            fs.writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
          } catch (err) {
            console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
            if (!isDebug) process.exit(1);
          }
        },
      }),

      ...(isDebug
        ? []
        : [
            // Webpack Bundle Analyzer
            // https://github.com/th0r/webpack-bundle-analyzer
            ...(isAnalyze ? [new BundleAnalyzerPlugin()] : []),
          ]),
    ],

    // Move modules that occur in multiple entry chunks to a new entry chunk (the commons chunk).
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            chunks: 'initial',
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
          },
        },
      },
    },

    // Some libraries import Node modules but don't use them in the browser.
    // Tell Webpack to provide empty mocks for them so importing them works.
    // https://webpack.js.org/configuration/node/
    // https://github.com/webpack/node-libs-browser/tree/master/mock
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
    },
  };

  if (mode === 'development') {
    return config;
  }
  return config;
};

module.exports = configFactory;
