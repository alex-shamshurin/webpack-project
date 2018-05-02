import webpack from 'webpack';
import webpackConfigFactory from './webpack.configFactory'
import { log } from './lib/utils';

const isServerConfig = true;
const isClientConfig = false;

const webpackConfig = webpackConfigFactory('production', isClientConfig);

webpack(webpackConfig).run((err, stats) => {
  if (err) {
    log({
      title: 'webpack',
      level: 'error',
      message: 'Error during build...'
    });
  }

  console.info(stats.toString(webpackConfig.stats));
  if (stats.hasErrors()) {
    log({
      title: 'webpack',
      level: 'error',
      message: 'Webpack compilation errors...'
    });
  }
});
