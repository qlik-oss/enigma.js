const enigma = require('enigma.js');
const WebSocket = require('ws');

const schema = require('enigma.js/schemas/12.20.0.json');

const session = enigma.create({
  schema,
  url: 'ws://localhost:9076/app/engineData',
  createSocket: url => new WebSocket(url),
});

session.open().then((global) => {
  global.createSessionApp().then((doc) => {
    console.log('Document: API fetched');

    const update = () => {
      // We end the example once we get another change on the document, when a
      // session is closed, all generated APIs will have their 'closed' event
      // emitted:
      doc.on('changed', () => session.close());
      doc.getAppLayout().then(() => {
        console.log('Document: Layout fetched');
        doc.getAppProperties().then((props) => {
          props.test = true;
          // Modifying the properties will trigger another change:
          doc.setAppProperties(props);
        });
      });
    };

    doc.on('changed', () => console.log('Document: changed'));
    doc.on('closed', () => console.log('Document: closed'));

    // Newly generated APIs is in a 'changed' state so we trigger our update logic
    // manually the first time:
    update();
  });
}).catch(error => console.log('Session: Failed to open socket:', error));
