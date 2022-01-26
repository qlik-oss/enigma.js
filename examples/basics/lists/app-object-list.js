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
  .then((global) => global.getActiveDoc())
  .then((doc) => {
    const tasks = [];

    // Create 10 objects of type my-object with unique titles
    for (let i = 0; i < 10; i += 1) {
      tasks.push(doc.createObject({
        qInfo: {
          qType: 'my-object',
        },
        meta: {
          title: `my-object${i}`,
        },
      }));
    }

    // Create a app object list using qAppObjectListDef and list all objects of type my-object
    // and also lists the title for each object.
    // eslint-disable-next-line no-restricted-globals
    return Promise.all(tasks).then(() => doc
      .createObject(properties)
      .then((object) => object.getLayout())
      .then((layout) => console.log('App object list:', JSON.stringify(layout, null, '  ')))
      .then(() => session.close()));
  })
  .catch((error) => {
    console.log('Session: Failed to open socket:', error);
    process.exit(1);
  });
