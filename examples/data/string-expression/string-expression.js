const createSession = require('../../session');

const qlikScript = `
TempTable:
Load
RecNo() as ID
AutoGenerate 100
`;

const stringExpressionProperties = {
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
      .setScript(qlikScript)
      .then(() => doc.doReload())
      // We create a string expression using
      // a field in the data we loaded:
      .then(() => doc.createObject(stringExpressionProperties))
      .then((stringExpression) => {
        // Just a helper function that helps fetching the layout and prints out
        // the evaluated string expression.
        const update = () =>
          stringExpression.getLayout().then((layout) => {
            console.log(
              'Evaluated string expression:',
              JSON.stringify(layout.expr, null, '  '));
          });

        update().then(() => session.close());
      });
  })
  .catch(error => console.log('Session: Failed to open socket:', error));
