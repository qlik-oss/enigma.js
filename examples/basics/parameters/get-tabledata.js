const createSession = require('../../session');

// inline script with a simple table
const script = `
exampletable:
load * Inline [
dim, val
foo, 23
bar, 42
c, 54
d, 21
];
`;

const session = createSession();

/**
 * Write the tabelContent to console.
 * @param {*} tabelContent
 */
function print(tableContent) {
  for (let i = 0; i < tableContent.length; i += 1) {
    console.log('dim: ${tableContent[i].qValue[0].qText} val: ${tableContent[i].qValue[1].qText}');
  }
}

// local variable to store the generated sessionapp
let sessionApp;

session.open()
  .then((global) => {
    console.log('Session opend');
    return global.createSessionApp();
  })
  .then((app) => {
    console.log('App generated');
    sessionApp = app;
    return app.setScript(script);
  })
  .then(() => {
    console.log('Script recieved');
    return sessionApp.doReload();
  })
  .then(() => {
    return Promise.all([
      sessionApp.getTableData(0, 4, false, 'exampletable')
        .then((tableContent) => {
          console.log('Position based');
          print(tableContent);
        }),
      sessionApp.getTableData({
        qOffset: 0,
        qRows: 4,
        qSyntheticMode: false,
        qTableName: 'exampletable'
      })
        .then((tableContent)=>{ 
          console.log('Name based');
          print(tableContent)
        })
    ]);
  })
  .then(() => {
      console.log('Session will be closed after every call is done');
    session.close();
  })
  .catch((error) => {
    console.error('Error', error);
  });
