const createSession = require('../../session');

const script = `
TempTable:
Load
RecNo() as Field1,
Rand() as Field2,
Rand() as Field3
AutoGenerate 100
`;

const properties = {
  qInfo: {
    qType: 'my-field-list',
  },
  qFieldListDef: {},
};

const session = createSession();

// Open the session and create a session document:
session
  .open()
  .then((global) => global.createSessionApp())
  .then((doc) => doc
    .setScript(script)
    .then(() => doc.doReload())
    .then(() => doc
      // Create a field list using qFieldListDef and list all fields available in the document.
      .createObject(properties)
      .then((object) => object.getLayout())
      .then((layout) => console.log('Field list:', JSON.stringify(layout, null, '  ')))
      .then(() => session.close())))
  .catch((error) => {
    console.log('Session: Failed to open socket:', error);
    process.exit(1);
  });
