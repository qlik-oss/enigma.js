/* eslint no-console:0, import/no-unresolved:0 */
const WebSocket = require('ws');
const Promise = require('bluebird');
const enigma = require('../../enigma');
const schema = require('../../schemas/12.20.0.json');

const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});
session.on('traffic:sent', data => console.log('->', data));
session.on('traffic:received', data => console.log('<-', data));
session.open().then(global => global.createSessionApp()).then((app) => {
  const promises = [];
  for (let i = 0; i < 3; i += 1) {
    const created = app.createObject({ qInfo: { qType: 'CustomType' }, num: i });
    promises.push(created);
  }
  Promise.all(promises).then((models) => {
    console.log('Number of models created:', models.length);
    process.exit();
  }).catch((err) => {
    console.log('Error creating one or more models:', err);
    process.exit();
  });
}).catch((err) => {
  console.log('Error opening Engine session:', err);
  process.exit();
});
