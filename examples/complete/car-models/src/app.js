/* eslint-env browser */
/* eslint import/no-unresolved:0, import/extensions:0, no-console:0 */

import angular from 'angular';
import enigma from 'enigma.js';

import schema from 'json-loader!../node_modules/enigma.js/schemas/12.20.0.json';
import template from 'raw-loader!./app.html';
import csv from 'raw-loader!../data.csv';
import chart from './chart';

const SCRIPT = `LOAD * Inline [
  ${csv}
];
`;

const reloadURI = encodeURIComponent(`${location.origin}/content/Default/redirect.html`);
const url = `${location.origin.replace(/^http/, 'ws')}/app/engineData?reloadURI=${reloadURI}`;

angular.module('app', []).component('app', {
  bindings: {},
  controller: ['$scope', '$q', function controller($scope, $q) {
    this.connected = false;
    this.painted = false;

    let object = null;

    const paintChart = (layout) => {
      chart(document.getElementById('bar-chart-container'), layout);
      this.painted = true;
    };

    this.$onInit = () => {
      const session = enigma.create({
        Promise: $q,
        schema,
        url,
      });
      session.on('notification:OnAuthenticationInformation', (authInfo) => {
        if (authInfo.mustAuthenticate) {
          location.href = authInfo.loginUri;
        }
      });
      session.on('traffic:*', (dir, data) => console.log(dir, data));
      session.open().then((global) => {
        this.connected = true;

        global.createSessionApp()
          .then((app) => app.setScript(SCRIPT)
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
                  qInitialDataFetch: [{
                    qTop: 0, qHeight: 500, qLeft: 0, qWidth: 17,
                  }],
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
