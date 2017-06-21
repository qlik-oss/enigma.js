/* eslint no-console:0, import/no-unresolved:0 */
const WebSocket = require('ws');
const enigma = require('../../dist/enigma');
const schema = require('../../schemas/qix/3.2/schema.json');

const cfg = {
  schema,
  appId: 'test',
  createSocket(url) {
    return new WebSocket(url);
  },
  session: {
    secure: false,
    port: 4848,
  },
};

enigma.create(cfg).then((qix) => {
  const promises = [];
  for (let i = 0; i < 1000; i += 1) {
    const created = qix.app.createObject({ qInfo: { qType: 'CustomType' }, num: i });
    promises.push(created);
  }
  Promise.all(promises).then((models) => {
    console.log('Number of models created:', models.length);
    process.exit();
  }).catch((err) => {
    console.log('Error creating all objects:', err);
    process.exit();
  });
}).catch((err) => {
  console.log('Error fetching qix service:', err);
  process.exit();
});
