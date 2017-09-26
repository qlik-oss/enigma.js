const enigma = require('enigma.js');
const WebSocket = require('ws');

const schema = require('enigma.js/schemas/12.20.0.json');

const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
  requestInterceptors: [{
    onFulfilled: function toggleDelta(sessionReference, request) {
      // check if the request is something we want to modify:
      if (request.method === 'EngineVersion' && request.handle === -1) {
        // we toggle the delta protocol flag off for this request specifically:
        request.delta = false;
      }
      return request;
    },
  }],
});

session.on('traffic:sent', data => console.log(`Sent: ${JSON.stringify(data)}`));

session.open()
  .then(global => global.getUniqueID()
    .then(result => console.log(`Unique ID: ${result}`))
    .then(() => global.engineVersion())
    .then(result => console.log(`Engine version: ${result.qComponentVersion}`)))
  .then(() => session.close())
  .catch((error) => {
    console.log('Session: Failed to open socket:', error);
    process.exit(1);
  });
