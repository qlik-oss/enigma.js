/* eslint import/no-unresolved:0, import/extensions:0, no-console:0 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('./node_modules/enigma.js/schemas/12.20.0.json');

const certificateDir = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';
const readCert = filename => fs.readFileSync(path.resolve(certificateDir, filename));

const config = {
  schema,
  url: 'wss://localhost:4747/app/engineData',
  createSocket: url => new WebSocket(url, {
    ca: [readCert('root.pem')],
    key: readCert('client_key.pem'),
    cert: readCert('client.pem'),
    headers: {
      'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
    },
  }),
};

const session = enigma.create(config);
session.on('traffic:*', (dir, data) => console.log(dir, data));

console.log('Connecting to Engine');

session.open().then((global) => {
  console.log('Connected');
  return global.getDocList().then((docList) => {
    const docs = docList.map(doc => `${doc.qDocName} - ${doc.qDocId}`).join('\n');
    console.log('--- Your server has the following apps ---');
    console.log(docs);
  });
}).catch((err) => {
  console.log(`Error when connecting to Engine: ${err}`);
  process.exit(1);
});
