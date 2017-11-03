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
  .then(global => global.createSessionApp())
  .then((app) => {
    sessionApp = app;
    return app.setScript(script);
  })
  .then(() => sessionApp.doReload())
  .then(() =>
    /**
     * The getTableData function returns the data from a specified table.
     */
    Promise.all([
      /**
       * The first example shows how to pass the parameter by position. By this way you pass
       * parameters by position in the order defined by the QIX method.
       */
      sessionApp.getTableData(0, 4, false, 'exampletable')
        .then((tableContent) => {
          console.log('Position based');
          print(tableContent);
        }),
      /**
       * The second example shows how to pass the parameter by name. By this way you can
       * pass the parameters wrapped in an object, and define the parameters with the specific
       * name. The order is not important.
       */
      sessionApp.getTableData({
        qTableName: 'exampletable',
        qSyntheticMode: false,
        qOffset: 0,
        qRows: 4,
      })
        .then((tableContent) => {
          console.log('Name based');
          print(tableContent);
        }),
    ]))
  .then(() => session.close())
  .catch((error) => {
    console.error('Error', error);
    process.exit(1);
  });
