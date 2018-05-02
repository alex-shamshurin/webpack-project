import webpack from 'webpack';
import webpackServe from 'webpack-serve';
import chokidar from 'chokidar';
import appRootDir from 'app-root-dir';
import { resolve as pathResolve } from 'path';
import { log } from './lib/utils';

const promisify = f => cb =>
  new Promise((resolve, reject) => {
    f(resolve, reject, cb);
  });

const isServerConfig = true;
const isClientConfig = false;

const serve = () => {
  const webpackConfigFactory = require('./webpack.configFactory');
  const webpackConfig = webpackConfigFactory('development', isClientConfig);
  return webpackServe({
    config: webpackConfig,
    content: pathResolve(appRootDir.get(), 'public')
  });
};

serve().then(initialServer => {
  let devServer = initialServer;
  const watcher = chokidar.watch([
    '*.json',
    '*.lock',
    'babel*',
    pathResolve(appRootDir.get(), 'tools')
  ]);

  watcher.on('ready', () => {
    watcher.on('change', (path, stats) => {
      log({
        title: 'webpack',
        level: 'warn',
        message: 'Restarting the development devServer...'
      });
      const closeAsync = promisify(devServer.close);
      closeAsync()
        .then(() => serve())
        .then(newServer => {
          devServer = newServer;
        })
        .catch(e => {
          console.log('Error in restarting', e);
        });
    });
  });
});
