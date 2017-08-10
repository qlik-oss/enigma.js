const createSession = require('../../session');

const qlikScript = `
TempTable:
Load
RecNo() as ID,
Rand() as Value
AutoGenerate 100
`;

const listObjectProperties = {
  qInfo: {
    qType: 'my-list-object',
  },
  qListObjectDef: {
    qDef: {
      qFieldDefs: ['Value'],
      qSortCriterias: [{ qSortByLoadOrder: 1 }],
    },
    qShowAlternatives: true,
    // We fetch the initial three values (top + height),
    // from the first column (left + width):
    qInitialDataFetch: [{
      qTop: 0,
      qHeight: 3,
      qLeft: 0,
      qWidth: 1,
    }],
  },
};

const session = createSession();

// Uncomment to see the websocket traffic:
// session.on('traffic:*', (direction, data) => console.log(`Session: Traffic (${direction}): ${JSON.stringify(data)}`));

// Open the session and create a session document:
session.open().then(global => global.createSessionApp()).then((doc) => {
  // Load in some data into the session document:
  doc.setScript(qlikScript).then(() => doc.doReload())
    // We create a generic object with a list object definition using
    // a field in the data we loaded:
    .then(() => doc.createObject(listObjectProperties))
    .then((listObject) => {
      // Just a helper function that helps fetching the layout and print out
      // some of the interesting data you can access from it:
      const update = () => listObject.getLayout().then((layout) => {
        console.log('Generic object info:', JSON.stringify(layout.qInfo, null, '  '));
        console.log('List object state:', JSON.stringify(layout.qListObject.qDimensionInfo.qStateCounts, null, '  '));
        console.log('List object data:', JSON.stringify(layout.qListObject.qDataPages[0].qMatrix, null, '  '));
      });

      console.log('\n### No selection:\n');
      update()
        // Select the first value:
        .then(() => listObject.selectListObjectValues('/qListObjectDef', [0], false))
        .then(() => console.log('\n### After selection (notice the `qState` values):\n'))
        .then(update)
        // Exit the example after we have printed the second layout:
        .then(() => session.close());
    });
}).catch(error => console.log('Session: Failed to open socket:', error));
