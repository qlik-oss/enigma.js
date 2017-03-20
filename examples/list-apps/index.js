/* eslint import/no-unresolved:0, import/extensions:0, no-console:0 */

const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const enigma = require('enigma.js');
const qixSchema = require('./node_modules/enigma.js/schemas/qix/3.2/schema.json');

const certificateDir = 'C:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates';

const config = {
  schema: qixSchema,
  session: {
    route: 'app/engineData',
    host: 'localhost',
    port: 4747,
  },
  createSocket(url) {
    return new WebSocket(url, {
      ca: [fs.readFileSync(path.resolve(certificateDir, 'root.pem'))],
      key: fs.readFileSync(path.resolve(certificateDir, 'client_key.pem')),
      cert: fs.readFileSync(path.resolve(certificateDir, 'client.pem')),
      headers: {
        'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
      },
    });
  },
  handleLog: logRow => console.log(logRow),
};

console.log('Connecting to Engine');
enigma.getService('qix', config).then((qix) => {
  console.log('Connected');
  return qix.global.getDocList().then((docList) => {
    const docs = docList.map(doc => `${doc.qDocName} - ${doc.qDocId}`).join('\n');
    console.log('--- Your server has the following apps ---');
    console.log(docs);
  });
}).catch((err) => {
  console.log(`Error when connecting to qix service: ${err}`);
  process.exit(1);
});
