import webpack from 'webpack';
import WebpackAssetsManifest from 'webpack-assets-manifest';
import nodeExternals from 'webpack-node-externals';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { resolve as pathResolve } from 'path';
import appRootDir from 'app-root-dir';
import fs from 'fs';
import pkg from '../package.json';

const ROOT_DIR = appRootDir.get();
const SRC_DIR = pathResolve(ROOT_DIR, 'src');
const BUILD_DIR = pathResolve(ROOT_DIR, 'build');

const reScript = /\.(js|jsx|mjs)$/;
const reStyle = /\.(css|less|styl|scss|sass|sss)$/;
const reImage = /\.(bmp|gif|jpg|jpeg|png|svg)$/;

// cssnano.co
const minimizeCssOptions = {
  discardComments: { removeAll: true },
  zindex: false,
  autoprefixer: false,
  reduceIdents: false,
  preset: 'default',
};

const configFactory = (mode, isServerConfig) => {
  const isDebug = process.NODE_ENV === 'development';
  const staticAssetName = isDebug
    ? '[path][name].[ext]?[hash:8]'
    : '[hash:8].[ext]';

  const isVerbose = process.argv.includes('--verbose');
  const isAnalyze =
    process.argv.includes('--analyze') || process.argv.includes('--analyse');

  const config = {
    context: ROOT_DIR,
    output: {
      path: BUILD_DIR,
      pathinfo: isVerbose,
      devtoolModuleFilenameTemplate: info =>
        pathResolve(info.absoluteResourcePath).replace(/\\/g, '/')
    },
    resolve: {
      modules: ['node_modules', 'src']
    },
    mode: isDebug ? 'development' : 'production',
    module: {
      // Ошибка вместо предупреждения если экспорт модуля
      // отсутствует
      strictExportPresence: true,

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
                    forceAllTransforms: !isDebug // для UglifyJS
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
            {
              issuer: { not: [reStyle] },
              use: 'isomorphic-style-loader'
            },

            {
              exclude: SRC_DIR,
              loader: 'css-loader',
              options: {
                sourceMap: isDebug,
                minimize: isDebug ? false : minimizeCssOptions
              }
            },

            {
              include: SRC_DIR,
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                sourceMap: isDebug,
                modules: true,
                localIdentName: isDebug
                  ? '[name]-[local]-[hash:base64:5]'
                  : '[hash:base64:5]',
                minimize: isDebug ? false : minimizeCssOptions
              }
            },

            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: './tools/postcss.config.js'
                }
              }
            },

            {
              test: /\.(scss|sass)$/,
              loader: 'sass-loader'
            }
          ]
        },

        {
          test: reImage,
          oneOf: [
            {
              issuer: reStyle,
              oneOf: [
                {
                  test: /\.svg$/,
                  loader: 'svg-url-loader',
                  options: {
                    name: staticAssetName,
                    limit: 4096 // 4kb
                  }
                },

                {
                  loader: 'url-loader',
                  options: {
                    name: staticAssetName,
                    limit: 4096 // 4kb
                  }
                }
              ]
            },

            {
              loader: 'file-loader',
              options: {
                name: staticAssetName
              }
              // Ужатие графики, если надо
              // loader: 'image-webpack-loader',
              // options: {
              //   name: staticAssetName,
              //   pngquant: {
              //     quality: '65-90',
              //     speed: 4,
              //     optimizationLevel: 7,
              //     interlaced: false
              //   },
              //   mozjpeg: {
              //     quality: 65
              //   }
              // }
            }
          ]
        },

        {
          test: /\.txt$/,
          loader: 'raw-loader'
        },

        // URL для всех остальных
        {
          exclude: [reScript, reStyle, reImage, /\.json$/, /\.txt$/],
          loader: 'file-loader',
          options: {
            name: staticAssetName
          }
        },

        // Исключить из прод сборки некоторые dev модули
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

    // не игноририть ошибки
    bail: !isDebug,
    cache: isDebug,

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

    devtool: isDebug ? 'cheap-module-inline-source-map' : 'source-map',
    performance: {
      hints: false
    }
  };

  //
  // Клиентский конфиг
  // -----------------------------------------------------------------------------

  const clientConfig = {
    ...config,

    name: 'client',
    target: 'web',

    entry: {
      client: ['@babel/polyfill', pathResolve(SRC_DIR, 'index.js')]
    },

    plugins: [
      new webpack.DefinePlugin({
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        'process.env.BROWSER': true,
        __DEV__: isDebug,
        __CLIENT__: !isServerConfig
      }),

      new WebpackAssetsManifest({
        output: `${BUILD_DIR}/asset-manifest.json`,
        publicPath: true,
        writeToDisk: true,
        customize: ({ key, value }) => {
          if (key.toLowerCase().endsWith('.map')) return false;
          return { key, value };
        },
        done: (manifest, stats) => {
          const chunkFileName = `${BUILD_DIR}/chunk-manifest.json`;
          try {
            const fileFilter = file => !file.endsWith('.map');
            const addPath = file => manifest.getPublicPath(file);
            const chunkFiles = stats.compilation.chunkGroups.reduce(
              (acc, c) => {
                acc[c.name] = [
                  ...(acc[c.name] || []),
                  ...c.chunks.reduce(
                    (files, cc) => [
                      ...files,
                      ...cc.files.filter(fileFilter).map(addPath)
                    ],
                    []
                  )
                ];
                return acc;
              },
              Object.create(null)
            );
            fs.writeFileSync(
              chunkFileName,
              JSON.stringify(chunkFiles, null, 2)
            );
          } catch (err) {
            console.error(`ERROR: Cannot write ${chunkFileName}: `, err);
            if (!isDebug) process.exit(1);
          }
        }
      }),

      ...(isDebug ? [] : [...(isAnalyze ? [new BundleAnalyzerPlugin()] : [])])
    ],

    // Вынесение в отдельный бандл общих частей
    // optimization: {
    //   splitChunks: {
    //     cacheGroups: {
    //       commons: {
    //         chunks: 'initial',
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors'
    //       }
    //     }
    //   }
    // },

    // Заглушки
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    }
  };

  return clientConfig;
};

module.exports = configFactory;
