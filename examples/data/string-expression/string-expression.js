const createSession = require('../../session');

const script = `
TempTable:
Load
RecNo() as ID
AutoGenerate 100
`;

const properties = {
  qInfo: {
    qType: 'StringExpression',
  },
  expr: {
    qStringExpression: { qExpr: "='count(ID) = ' & count(ID)" },
  },
};

const session = createSession();

// Open the session and create a session document:
session
  .open()
  .then(global => global.createSessionApp())
  .then((doc) => {
    // Load in some data into the session document:
    doc
      .setScript(script)
      .then(() => doc.doReload())
      // We create a string expression using
      // a field in the data we loaded:
      .then(() => doc.createObject(properties))
      .then(object => object.getLayout())
      .then(layout => console.log('Evaluated string expression:', JSON.stringify(layout.expr, null, '  ')))
      .then(() => session.close());
  })
  .catch((error) => {
    console.log('Session: Failed to open socket:', error);
    process.exit(1);
  });
