const enigma = require('enigma.js');
const WebSocket = require('ws');

const schema = require('enigma.js/schemas/12.20.0.json');

// How many consecutive times we should retry before failing, try lowering this
// to see how it behaves when you reach MAX_RETRIES:
const MAX_RETRIES = 3;
// We auto-generate a table with one million entries to make sure we can reproduce
// aborted requests:
const qlikScript = `
TempTable:
Load
RecNo() as ID,
Rand() as Value
AutoGenerate 1000000
`;

const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
  responseInterceptors: [{
    // We only want to handle failed responses from QIX Engine:
    onRejected: function retryAbortedError(sessionReference, request, error) {
      console.log('Request: Rejected', error);
      // We only want to handle aborted QIX errors:
      if (error.code === schema.enums.LocalizedErrorCode.LOCERR_GENERIC_ABORTED) {
        // We keep track of how many consecutive times we have tried to do this call:
        request.tries = (request.tries || 0) + 1;
        console.log(`Request: Retry #${request.tries}`);
        // We do not want to get stuck in an infinite loop here if something has gone
        // awry, so we only retry until we have reached MAX_RETRIES:
        if (request.tries <= MAX_RETRIES) {
          return request.retry();
        }
      }
      // If it was not an aborted QIX call, or if we reached MAX_RETRIES, we let the error
      // trickle down to potential other interceptors, and finally down to resolving/rejecting
      // the initial promise that the user got when invoking the QIX method:
      return this.Promise.reject(error);
    },
  }],
});

// Uncomment to see the websocket traffic:
// session.on('traffic:*', (direction, data) => console.log(`Traffic (${direction}):`, data));

session.open().then((global) => {
  global.createSessionApp().then((doc) => {
    console.log('Document: Opened');
    // We prep the document with some data to make sure QIX Engine is calculating
    // when we do another call that will cause aborted requests:
    return doc.setScript(qlikScript).then(() => doc.doReload()).then(() => {
      console.log('Document: Data loaded');
      // Evaluate something from the data model:
      const evaluate = doc.evaluate('COUNT(Value)')
        .then(result => console.log(`Expression evaluated: ${result}`));
      // While the expression is being calculated, fire away a call that would
      // potentially invalidate the data model calculation:
      const invalidate = doc.clearAll().then(() => doc.clearAll()).then(() => doc.clearAll());
      return Promise.all([evaluate, invalidate])
        .then(() => session.close())
        .catch(() => session.close());
    });
  });
}).catch((error) => {
  console.log('Session: Failed to open socket:', error);
  process.exit(1);
});
