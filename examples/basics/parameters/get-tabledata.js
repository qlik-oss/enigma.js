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
    console.log(`dim: ${tableContent[i].qValue[0].qText} val: ${tableContent[i].qValue[1].qText}`);
  }
}

// local variable to store the generated sessionapp
let sessionApp;

session.open()
  .then((global) => {
    return global.createSessionApp();
  })
  .then((app) => {
    sessionApp = app;
    return app.setScript(script);
  })
  .then(() => {
    return sessionApp.doReload();
  })
  .then(() => {
    /**
     * the getTableData functions receives the data from a specified Table. Since v2.0.0 you
     * can make the function call either by name or by position.
     * 
     * The first example shows how to pass the parameter by position. By this way you insert
     * the parameter in the order defined on the qlik help site for this function. Hereby the
     * order of the parameters is important
     * 
     * The second example shows how to pass the parameter by position. By this way you can
     * pass the parameters wrapped  in an object, and define the parameters with the specific
     * name. The order is not important.
     */
    const returnProm = Promise.all([
      sessionApp.getTableData(0, 4, false, 'exampletable')
        .then((tableContent) => {
          console.log('Position based');
          print(tableContent);
        }),
      sessionApp.getTableData({
        qOffset: 0,
        qRows: 4,
        qSyntheticMode: false,
        qTableName: 'exampletable',
      })
        .then((tableContent) => {
          console.log('Name based');
          print(tableContent);
        }),
    ]);

    return returnProm;
  })
  .then(() => {
    session.close();
  })
  .catch((error) => {
    console.error('Error', error);
  });
