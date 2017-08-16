const createSession = require('../../session');

const qlikScript = `
TempTable:
Load
RecNo() as ID,
RecNo()+1 as ID2,
Rand() as Value
AutoGenerate 100
`;

const properties = {
  qInfo: {
    qType: 'my-pivot-hypercube',
  },
  qHyperCubeDef: {
    qDimensions: [
      {
        qDef: { qFieldDefs: ['ID'] },
      },
      {
        qDef: { qFieldDefs: ['ID2'] },
      },
    ],
    qMeasures: [
      { qDef: { qDef: 'Sum(Value)' } },
    ],
    qMode: 'EQ_DATA_MODE_PIVOT',
    qAlwaysFullyExpanded: true,
  },
};

const session = createSession();

// Open the session and create a session document:
session.open()
  .then(global => global.createSessionApp())
  .then(doc => doc.setScript(qlikScript)
    .then(() => doc.doReload())
    // Create a generic object with a hypercube pivot definition containing two dimensions and one measure
    .then(() => doc.createObject(properties))
    // Get hypercube pivot data
    .then(object => object.getHyperCubePivotData('/qHyperCubeDef', [
      {
        qTop: 0,
        qLeft: 0,
        qHeight: 5,
        qWidth: 2,
      },
    ])
      .then(data => console.log('Hypercube data pages:', JSON.stringify(data, null, '  ')))
      // Select second value in the first column of the data matrix
      .then(() => object.selectPivotCells('/qHyperCubeDef', [{
        qType: 'D',
        qRow: 1,
        qCol: 0,
      }], false))
      // Get pivot data
      .then(() => object.getHyperCubePivotData('/qHyperCubeDef', [
        {
          qTop: 0,
          qLeft: 0,
          qHeight: 5,
          qWidth: 2,
        },
      ]).then(data => console.log('Hypercube data pages after selection:', JSON.stringify(data, null, '  '))))))
  // Close the session
  .then(() => session.close())
  .catch(error => console.log('Session: Failed to open socket:', error));
