const createSession = require('../../session');

const properties = {
  qInfo: {
    qType: 'my-list',
  },
  qAppObjectListDef: {
    qType: 'my-object',
    qData: {
      title: '/meta/title',
    },
  },
};

const session = createSession();

// Open the session and create a session document:
session
  .open()
  .then(global => global.createSessionApp())
  .then((doc) => {
    // Create 10 objects of type my-object with unique titles
    for (let i = 0; i < 10; i += 1) {
      doc.createObject({
        qInfo: {
          qType: 'my-object',
        },
        meta: {
          title: `my-object${i}`,
        },
      });
    }

    // Create a app object list using qAppObjectListDef and list all objects of type my-object
    // and also lists the title for each object.
    doc
      .createObject(properties)
      .then(object => object.getLayout())
      .then(layout => console.log('App object list:', JSON.stringify(layout, null, '  ')))
      .then(() => session.close());
  })
  .catch(error => console.log('Session: Failed to open socket:', error));
