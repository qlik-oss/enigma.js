import enigma from '../../src/enigma';
import utils from './utils';
import ctrl00 from './load-scripts/ctrl00';

const HIGH_TIMEOUT = 15000;

describe('Sugar mixins', () => {
  let qixGlobal;

  const globalMixin = {
    types: 'Global',
    extend: {
      prepareSessionApp(script) {
        let app;
        return this.createSessionApp()
          .then((a) => { app = a; })
          .then(() => app.setScript(script))
          .then(() => app.doReload(0, false, false))
          .then(() => app);
      },
    },
  };

  const docMixin = {
    types: 'Doc',
    extend: {
      getList(listDef) {
        return this.getObject(listDef.qInfo.qId)
          .catch(() => this.createSessionObject(listDef))
          .then((obj) => obj.getLayout());
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
  };

  beforeEach(() => {
    const config = utils.getDefaultConfig();
    config.mixins = [globalMixin, docMixin];

    return enigma.create(config).open().then((global) => {
      qixGlobal = global;
    });
  });

  afterEach(() => qixGlobal.session.close());

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
    const sheetName = 'mySheetName';

    let app;
    let sheet;

    return qixGlobal.createSessionApp()
      .then((a) => { app = a; })
      .then(() => app.getList(listDef))
      .then((list) => expect(list.qAppObjectList.qItems.length).to.equal(0))
      .then(() => app.createSheet(sheetName))
      .then((s) => { sheet = s; })
      .then(() => app.getList(listDef))
      .then((list) => {
        expect(list.qAppObjectList.qItems.length).to.equal(1);
        expect(list.qAppObjectList.qItems[0].qInfo.qId).to.equal(sheet.id);
      });
  }).timeout(HIGH_TIMEOUT);

  it('should load script and make selections', () => {
    const listDef = {
      qInfo: {
        qType: 'CurrentSelection',
      },
      qSelectionObjectDef: {},
    };
    let app;

    return qixGlobal.prepareSessionApp(ctrl00)
      .then((a) => { app = a; })
      .then(() => app.getField('Alpha'))
      .then((field) => field.selectAll())
      .then(() => app.getList(listDef))
      .then((list) => expect(list.qSelectionObject.qSelections[0].qSelectedCount).to.equal(26));
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
    let app;
    let measure;

    return qixGlobal.prepareSessionApp(ctrl00)
      .then((a) => { app = a; })
      .then(() => app.createMeasure(measureDef))
      .then((m) => { measure = m; })
      .then(() => app.getList(listDef))
      .then((list) => expect(measure.id).to.equal(list.qMeasureList.qItems[0].qInfo.qId));
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

    return qixGlobal.prepareSessionApp(ctrl00)
      .then((app) => app.getList(listDef))
      .then((list) => list.qFieldList.qItems.filter((qField) => qField.qIsHidden !== true))
      .then((userFields) => expect(userFields.length).to.equal(12));
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
    let app;
    let dimension;

    return qixGlobal.prepareSessionApp(ctrl00)
      .then((a) => { app = a; })
      .then(() => app.createDimension(dimensionDef))
      .then((d) => { dimension = d; })
      .then(() => app.getList(listDef))
      .then((list) => expect(dimension.id).to.equal(list.qDimensionList.qItems[0].qInfo.qId));
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
    let app;
    let variable;

    return qixGlobal.prepareSessionApp(ctrl00)
      .then((a) => { app = a; })
      .then(() => app.createVariableEx(variableDef))
      .then((v) => { variable = v; })
      .then(() => app.getList(listDef))
      .then((list) => list.qVariableList.qItems.filter((v) => v.qIsReserved !== true))
      .then((userVariables) => expect(userVariables[0].qInfo.qId).to.equal(variable.id));
  }).timeout(HIGH_TIMEOUT);
});
