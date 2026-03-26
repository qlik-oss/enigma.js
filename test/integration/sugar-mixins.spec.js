import enigma from '../../src/enigma';
import utils from './utils';
import ctrl00 from './load-scripts/ctrl00';

const HIGH_TIMEOUT = 15000;

describe('Sugar mixins', () => {
  let qixGlobal;

  const globalMixin = {
    types: 'Global',
    extend: {
      async prepareSessionApp(script) {
        const app = await this.getActiveDoc();
        await app.setScript(script);
        await app.doReload(0, false, false);
        return app;
      },
    },
  };

  const docMixin = {
    types: 'Doc',
    extend: {
      async getList(listDef) {
        let obj;
        try {
          obj = await this.getObject(listDef.qInfo.qId);
        } catch (err) {
          obj = await this.createSessionObject(listDef);
        }
        return obj.getLayout();
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

  beforeEach(async () => {
    const config = utils.getDefaultConfig();
    config.mixins = [globalMixin, docMixin];

    qixGlobal = await enigma.create(config).open();
  });

  afterEach(() => qixGlobal.session.close());

  it('should create and list sheets', async () => {
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

    const app = await qixGlobal.getActiveDoc();
    const initialList = await app.getList(listDef);
    expect(initialList.qAppObjectList.qItems.length).to.equal(0);
    const sheet = await app.createSheet(sheetName);
    const updatedList = await app.getList(listDef);
    expect(updatedList.qAppObjectList.qItems.length).to.equal(1);
    expect(updatedList.qAppObjectList.qItems[0].qInfo.qId).to.equal(sheet.id);
  }, HIGH_TIMEOUT);

  it('should load script and make selections', async () => {
    const listDef = {
      qInfo: {
        qType: 'CurrentSelection',
      },
      qSelectionObjectDef: {},
    };
    const app = await qixGlobal.prepareSessionApp(ctrl00);
    const field = await app.getField('Alpha');
    await field.selectAll();
    const list = await app.getList(listDef);
    expect(list.qSelectionObject.qSelections[0].qSelectedCount).to.equal(26);
  }, HIGH_TIMEOUT);

  it('should create and list measures', async () => {
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
    const app = await qixGlobal.prepareSessionApp(ctrl00);
    const measure = await app.createMeasure(measureDef);
    const list = await app.getList(listDef);
    expect(measure.id).to.equal(list.qMeasureList.qItems[0].qInfo.qId);
  }, HIGH_TIMEOUT);

  it('should load script and list fields', async () => {
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

    const app = await qixGlobal.prepareSessionApp(ctrl00);
    const list = await app.getList(listDef);
    const userFields = list.qFieldList.qItems.filter((qField) => qField.qIsHidden !== true);
    expect(userFields.length).to.equal(12);
  }, HIGH_TIMEOUT);

  it('should create and list dimensions', async () => {
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
    const app = await qixGlobal.prepareSessionApp(ctrl00);
    const dimension = await app.createDimension(dimensionDef);
    const list = await app.getList(listDef);
    expect(dimension.id).to.equal(list.qDimensionList.qItems[0].qInfo.qId);
  }, HIGH_TIMEOUT);

  it('should list created Variable', async () => {
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
    const app = await qixGlobal.prepareSessionApp(ctrl00);
    const variable = await app.createVariableEx(variableDef);
    const list = await app.getList(listDef);
    const userVariables = list.qVariableList.qItems.filter((v) => v.qIsReserved !== true);
    expect(userVariables[0].qInfo.qId).to.equal(variable.id);
  }, HIGH_TIMEOUT);
});
