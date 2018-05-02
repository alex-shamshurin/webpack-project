import express from 'express';
import { log } from './lib/utils';
import appRootDir from 'app-root-dir';
import { resolve as pathResolve } from 'path';

const app = express();

app.use(express.static(pathResolve(appRootDir.get(), 'public')));
app.use(express.static(pathResolve(appRootDir.get(), 'build')));

app.get('/', function(req, res) {
  res.sendfile(pathResolve(appRootDir.get(), 'public', 'index.html'));
});

app.listen(8080, function() {
  log({
    title: 'server',
    level: 'info',
    message: 'Listening on port 8080'
  });
});
