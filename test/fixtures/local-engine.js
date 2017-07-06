/* eslint no-console:0, import/no-unresolved:0 */
const WebSocket = require('ws');
const enigma = require('../../enigma');
const schema = require('../../schemas/12.20.0.json');

const cfg = {
  schema,
  createSocket(url) {
    return new WebSocket(url);
  },
  listeners: {
    'traffic:sent': data => console.log('->', data),
    'traffic:received': data => console.log('<-', data),
    'traffic:*': (dir, data) => console.log(dir, data),
  },
  session: {
    secure: false,
    port: 4848,
  },
};

enigma.connect(cfg).then(qix => qix.global.createSessionApp()).then((app) => {
  const promises = [];
  for (let i = 0; i < 3; i += 1) {
    const created = app.createObject({ qInfo: { qType: 'CustomType' }, num: i });
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
