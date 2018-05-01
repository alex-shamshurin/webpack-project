// Babel configuration
// https://babeljs.io/docs/usage/api/
module.exports = {

  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    ['@babel/preset-stage-2', { decoratorsLegacy: true }],
    '@babel/preset-flow',
    '@babel/preset-react'
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }]
  ],

  env: {
    development: {
      plugins: ['react-hot-loader/babel']
    }
  },
  ignore: ['node_modules', 'build']
};
