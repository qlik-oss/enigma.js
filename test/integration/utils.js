import Promise from 'bluebird';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import schema from '../../schemas/12.20.0.json';

function getDefaultConfig() {
  const host = 'localhost';
  const port = 9076;
  const protocol = 'ws';

  return {
    Promise,
    schema,
    url: `${protocol}://${host}:${port}/app/engineData/identity/${+new Date()}`,
    createSocket: url => new WebSocket(url),
  };
}

function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.lstat(filePath, (err) => {
      resolve(!err);
    });
  });
}

function getScript(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(__dirname, 'load-scripts', fileName);

    return this.fileExists(filePath).then((exists) => {
      if (exists) {
        resolve(fs.readFileSync(filePath).toString());
      } else {
        reject();
      }
    });
  });
}

export default { getDefaultConfig, fileExists, getScript };
