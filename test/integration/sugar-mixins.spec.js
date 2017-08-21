import Promise from 'bluebird';
import WebSocket from 'ws';
import Qix from '../../src/qix';
import schema from '../../schemas/12.20.0.json';
import utils from './utils';

const HIGH_TIMEOUT = 15000;

describe('Sugar mixins', () => {
  let qixGlobal;
  let config;

  before(() =>
    utils.getDefaultConfig().then((cfg) => {
      config = cfg;
      config.createSocket = url =>
        new WebSocket(url, config.socket);
      config.Promise = Promise;
      config.schema = schema;
      config.mixins = [{
        types: 'Global',
        extend: {
          createAppAndLoad(appName, scriptName) {
            return qixGlobal.createApp(appName).then(appInfo =>
              qixGlobal.openDoc(appInfo.qAppId).then(app =>
                utils.getScript(scriptName).then(loadScript =>
                  app.setScript(loadScript).then(() =>
                    app.doReload(0, false, false).then(() => ({ app, appInfo })),
                  ),
                ),
              ).catch(err =>
                qixGlobal.deleteApp(appInfo.qAppId).then(() => {
                  throw err;
                }),
              ),
            );
          },
        },
      }, {
        types: 'Doc',
        extend: {
          getList(listDef) {
            return this.getObject(listDef.qInfo.qId)
              .catch(() => this.createSessionObject(listDef))
              .then(obj =>
                obj.getLayout(),
              );
          },
          createSheet(title, description, thumbnail) {
            return this.createObject({
              qInfo: {
                qType: 'sheet',
              },
              qMetaDef: {
                title: title || '',
                description: description || '',
              },
              rank: -1,
              thumbnail: { qStaticContentUrlDef: thumbnail || null },
              columns: 24,
              rows: 12,
              cells: [],
              qChildListDef: {
                qData: {
                  title: '/title',
                },
              },
            });
          },
        },
      }];

      return Qix.create(config).open().then((global) => {
        qixGlobal = global;
      });
    }));

  after(() => {
    qixGlobal.session.on('error', () => {}); // Swallow the error
    return qixGlobal.session.close();
  });

  it('should create and list sheets', () => {
    const listDef = {
      qInfo: {
        qType: 'sheetList',
      },
      qAppObjectListDef: {
        qType: 'sheet',
        qData: {
          title: '/qMetaDef/title',
          description: '/qMetaDef/description',
          thumbnail: '/thumbnail',
          cells: '/cells',
          rank: '/rank',
          columns: '/columns',
          rows: '/rows',
        },
      },
    };
    const appName = 'myAppName1';
    const sheetName = 'mySheetName';

    return qixGlobal.createApp(appName).then(appInfo =>
      qixGlobal.openDoc(appInfo.qAppId).then(app =>
        app.getList(listDef).then((list) => {
          expect(list.qAppObjectList.qItems.length).to.equal(0);
          return app.createSheet(sheetName).then(sheet =>
            app.getList(listDef).then((listAfter) => {
              expect(listAfter.qAppObjectList.qItems.length).to.equal(1);
              expect(listAfter.qAppObjectList.qItems[0].qInfo.qId).to.equal(sheet.id);
              return qixGlobal.deleteApp(appInfo.qAppId);
            }),
          );
        }),
      ).catch(err =>
        qixGlobal.deleteApp(appInfo.qAppId).then(() => {
          throw err;
        }),
      ),
    );
  }).timeout(HIGH_TIMEOUT);

  it('should load script and make selections', () => {
    const listDef = {
      qInfo: {
        qType: 'CurrentSelection',
      },
      qSelectionObjectDef: {},
    };
    const appName = 'myAppName2';
    const scriptName = 'ctrl00.txt';

    return qixGlobal.createAppAndLoad(appName, scriptName).then((obj) => {
      const app = obj.app;
      const appInfo = obj.appInfo;
      return app.getField('Alpha').then(field =>
        field.selectAll().then(() =>
          app.getList(listDef).then((list) => {
            expect(list.qSelectionObject.qSelections[0].qSelectedCount).to.equal(26);
            return qixGlobal.deleteApp(appInfo.qAppId);
          }),
        ),
      ).catch(err =>
        qixGlobal.deleteApp(appInfo.qAppId).then(() => {
          throw err;
        }),
      );
    });
  }).timeout(HIGH_TIMEOUT);

  it('should create and list measures', () => {
    const listDef = {
      qInfo: {
        qType: 'measureList',
      },
      qMeasureListDef: {
        qType: 'measure',
        qData: {
          title: '/title',
          tags: '/tags',
        },
      },
    };
    const measureDef = {
      qInfo: {
        qType: 'measure',
      },
      qMetaDef: {
        title: 'myMeasure',
        description: 'myDescription',
        tags: [],
      },
      qMeasure: {
        qLabel: 'myMeasure',
        qDef: 'sum(Num)',
      },
    };
    const appName = 'myAppName3';
    const scriptName = 'ctrl00.txt';

    return qixGlobal.createAppAndLoad(appName, scriptName).then((obj) => {
      const app = obj.app;
      const appInfo = obj.appInfo;
      return app.createMeasure(measureDef).then(measure =>
        app.getList(listDef).then((list) => {
          const createdMeasureId = measure.id;
          const listMeasure = list.qMeasureList.qItems[0].qInfo.qId;
          expect(createdMeasureId).to.equal(listMeasure);
          return qixGlobal.deleteApp(appInfo.qAppId);
        }),
      ).catch(err =>
        qixGlobal.deleteApp(appInfo.qAppId).then(() => {
          throw err;
        }),
      );
    });
  }).timeout(HIGH_TIMEOUT);

  it('should load script and list fields', () => {
    const listDef = {
      qInfo: {
        qType: 'FieldList',
      },
      qFieldListDef: {
        qShowSystem: true,
        qShowHidden: true,
        qShowSemantic: true,
        qShowSrcTables: true,
      },
    };
    const appName = 'myAppName4';
    const scriptName = 'ctrl00.txt';

    return qixGlobal.createAppAndLoad(appName, scriptName).then((obj) => {
      const app = obj.app;
      const appInfo = obj.appInfo;
      return app.getList(listDef).then((list) => {
        const userFields = list.qFieldList.qItems.filter(qField =>
          qField.qIsHidden !== true,
        );
        expect(userFields.length).to.equal(12);
        return qixGlobal.deleteApp(appInfo.qAppId);
      }).catch(err =>
        qixGlobal.deleteApp(appInfo.qAppId).then(() => {
          throw err;
        }),
      );
    });
  }).timeout(HIGH_TIMEOUT);

  it('should create and list dimensions', () => {
    const listDef = {
      qInfo: {
        qType: 'dimensionList',
      },
      qDimensionListDef: {
        qType: 'dimension',
        qData: {
          title: '/title',
          tags: '/tags',
          grouping: '/qDim/qGrouping',
          info: '/qDimInfos',
        },
      },
    };
    const dimensionDef = {
      qInfo: {
        qType: 'dimension',
      },
      qDim: {
        qGrouping: 'N',
        qFieldDefs: [
          'Dim1',
        ],
        title: 'myDim',
        qFieldLabels: [
          'myDim',
        ],
      },
      qMetaDef: {
        title: 'myDim',
        description: 'Description',
        tags: [],
      },
    };
    const appName = 'myAppName5';
    const scriptName = 'ctrl00.txt';

    return qixGlobal.createAppAndLoad(appName, scriptName).then((obj) => {
      const app = obj.app;
      const appInfo = obj.appInfo;
      return app.createDimension(dimensionDef).then(dimension =>
        app.getList(listDef).then((list) => {
          const createdDimensionId = dimension.id;
          const listDiemnsion = list.qDimensionList.qItems[0].qInfo.qId;
          expect(createdDimensionId).to.equal(listDiemnsion);
          return qixGlobal.deleteApp(appInfo.qAppId);
        }),
      ).catch(err =>
        qixGlobal.deleteApp(appInfo.qAppId).then(() => {
          throw err;
        }),
      );
    });
  }).timeout(HIGH_TIMEOUT);

  it('should list created Variable', () => {
    const listDef = {
      qInfo: {
        qType: 'variableList',
      },
      qVariableListDef: {
        qType: 'variable',
        qShowReserved: true,
        qShowConfig: true,
        qData: {
          tags: '/tags',
        },
      },
    };
    const variableDef = {
      qInfo: {
        qType: 'variable',
      },
      qName: 'myVar',
      qComment: '',
      qDefinition: 'Month',
    };
    const appName = 'myAppName6';
    const scriptName = 'ctrl00.txt';

    return qixGlobal.createAppAndLoad(appName, scriptName).then((obj) => {
      const app = obj.app;
      const appInfo = obj.appInfo;
      return app.createVariableEx(variableDef).then(variable =>
        app.getList(listDef).then((list) => {
          const createdVariableId = variable.id;
          const userVariables = list.qVariableList.qItems.filter(qVariable =>
            qVariable.qIsReserved !== true,
          );
          expect(userVariables[0].qInfo.qId).to.equal(createdVariableId);
          return qixGlobal.deleteApp(appInfo.qAppId);
        }),
      ).catch(err =>
        qixGlobal.deleteApp(appInfo.qAppId).then(() => {
          throw err;
        }),
      );
    });
  }).timeout(HIGH_TIMEOUT);
});
