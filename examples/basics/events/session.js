const enigma = require('enigma.js');
const WebSocket = require('ws');

const schema = require('enigma.js/schemas/12.20.0.json');

const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});

/*
* It is good practice to bind any session events _before_ opening the session.
* This ensures that any timing-sensitive events have event handlers bound when
* they are emitted.
*/

session.on('opened', () => console.log('Session: Opened'));
session.on('closed', () => console.log('Session: Closed'));
// The QIX Engine JSON-RPC notification `OnConnected` is sent directly when a
// websocket is opened, which contain information about the session (only available
// in QIX Engine version 12.20.0 and later):
session.on('notification:*', name => console.log(`Session: Notification event: ${name}`));
session.on('traffic:*', (direction, data) => console.log(`Session: Traffic (${direction}): ${JSON.stringify(data)}`));
session.on('handle:changed', handle => console.log(`Session: Handle changed: ${handle}`));
session.on('handle:closed', handle => console.log(`Session: Handle closed: ${handle}`));
session.on('suspended', event => console.log(`Session: Suspended, initiator: ${event.initiator}`));
session.on('resumed', () => console.log('Session: Resumed'));

session.open().then((global) => {
  global.createSessionApp().then((doc) => {
    console.log(`Session: Document id: ${doc.id}`);
    session.suspend().then(() => {
      console.log('Session: suspend() completed');
      session.resume().then(() => {
        console.log('Session: resume() completed');
        session.close().then(() => {
          console.log('Session: close() completed');
        });
      });
    });
  });
}).catch(error => console.log('Session: Failed to open socket:', error));
