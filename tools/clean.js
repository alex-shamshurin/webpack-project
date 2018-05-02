import fs from 'fs';
import glob from 'glob';
import rimraf from 'rimraf';
import { log } from './lib/utils';

const cleanDir = (pattern, options) =>
  rimraf(pattern, { glob: options }, err => {
    if (err) {
      log({
        title: 'clean',
        level: 'error',
        message: `Error on deleting files: ${err}`
      });
    }
  });

cleanDir('build/*', {
  nosort: true,
  dot: true,
  ignore: ['build/.git']
});
