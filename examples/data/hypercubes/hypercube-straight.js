const createSession = require('../../session');

const qlikScript = `
TempTable:
Load
RecNo() as ID,
Rand() as Value
AutoGenerate 100
`;

const properties = {
  qInfo: {
    qType: 'my-straight-hypercube',
  },
  qHyperCubeDef: {
    qDimensions: [
      {
        qDef: { qFieldDefs: ['ID'] },
      },
    ],
    qMeasures: [
      {
        qDef: { qDef: '=Sum(Value)' },
      },
    ],
    qInitialDataFetch: [
      {
        qHeight: 5,
        qWidth: 2,
      },
    ],
  },
};

const session = createSession();

// Open the session and create a session document:
session.open()
  .then(global => global.createSessionApp())
  .then(doc => doc.setScript(qlikScript)
    .then(() => doc.doReload())
    // Create a generic object with a hypercube definition containing one dimension and one measure
    .then(() => doc.createObject(properties))
    // Get hypercube layout
    .then(object => object.getLayout()
      .then(layout => console.log('Hypercube data pages:', JSON.stringify(layout.qHyperCube.qDataPages, null, '  ')))
      // Select cells at position 0, 2 and 4 in the dimension.
      .then(() => object.selectHyperCubeCells('/qHyperCubeDef', [0, 2, 4], [0], false))
      // Get layout and view the selected values
      .then(() => console.log('\n### After selection (notice the `qState` values):\n'))
      .then(() => object.getLayout().then(layout => console.log('Hypercube data pages after selection:', JSON.stringify(layout.qHyperCube.qDataPages, null, '  '))))))
  // Close the session
  .then(() => session.close())
  .catch((error) => {
    console.log('Session: Failed to open socket:', error);
    process.exit(1);
  });
