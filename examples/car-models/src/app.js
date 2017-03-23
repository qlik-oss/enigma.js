/* eslint-env browser*/
/* eslint import/no-unresolved:0, import/extensions:0, no-console:0 */

import angular from 'angular';
import enigma from 'enigma.js';

import qixSchema from 'json!../node_modules/enigma.js/schemas/qix/3.2/schema.json';
import template from 'raw!./app.html';
import csv from 'raw!../data.csv';
import paintBarchart from './chart';

const SCRIPT =
`LOAD * Inline [
  ${csv}
];
`;

const HOST = 'my-sense-deploy.hostname.org';

angular.module('app', []).component('app', {
  bindings: {},
  controller: ['$scope', '$q', function controller($scope, $q) {
    this.connected = false;
    this.painted = false;

    let object = null;

    const paintChart = (layout) => {
      paintBarchart(document.getElementById('bar-chart-container'), layout);
      this.painted = true;
    };

    this.$onInit = () => {
      const config = {
        Promise: $q,
        schema: qixSchema,
        session: {
          host: HOST,
          route: 'app/engineData',
          urlParams: {
            reloadURI: `https://${HOST}/content/Default/redirect.html`,
          },
        },
        listeners: {
          'notification:OnAuthenticationInformation': (authInfo) => {
            if (authInfo.mustAuthenticate) {
              location.href = authInfo.loginUri;
            }
          },
        },
        handleLog: logRow => console.log(logRow),
      };
      enigma.getService('qix', config).then((qix) => {
        this.connected = true;

        qix.global.createSessionApp()
        .then(app => app.setScript(SCRIPT)
        .then(() => app.doReload())
        .then(() => {
          const barchartProperties = {
            qInfo: {
              qType: 'visualization',
              qId: '',
            },
            type: 'my-d3-barchart',
            labels: true,
            qHyperCubeDef: {
              qDimensions: [{
                qDef: {
                  qFieldDefs: ['Name'],
                  qSortCriterias: [{
                    qSortByAscii: 1,
                  }],
                },
              }],
              qMeasures: [{
                qDef: {
                  qDef: 'Avg([Horsepower])',
                },
                qSortBy: {
                  qSortByNumeric: -1,
                },
              }],
              qInterColumnSortOrder: [1, 0],
              qInitialDataFetch: [{ qTop: 0, qHeight: 500, qLeft: 0, qWidth: 17 }],
              qSuppressZero: false,
              qSuppressMissing: true,
            },
          };
          app.createSessionObject(barchartProperties).then((model) => {
            object = model;

            const update = () => object.getLayout().then((layout) => {
              paintChart(layout);
            });

            object.on('changed', update);
            update();
          });
        }));
      }, () => {
        this.error = 'Could not connect to QIX Engine. See console log for error details.';
      });
    };

    this.sortByModel = () => {
      object.applyPatches([{
        qOp: 'replace',
        qPath: '/qHyperCubeDef/qInterColumnSortOrder',
        qValue: JSON.stringify([0, 1]),
      }]);
    };

    this.sortByHorsepower = () => {
      object.applyPatches([{
        qOp: 'replace',
        qPath: '/qHyperCubeDef/qInterColumnSortOrder',
        qValue: JSON.stringify([1, 0]),
      }]);
    };
  }],
  template,
});

angular.bootstrap(document, ['app']);
