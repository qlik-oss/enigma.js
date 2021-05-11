const path = require('path')
const url = require('url')
const WebSocket = require('ws');
const fs = require('fs');
//Public resource folder path
const axios = require('axios')

const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.612.0.json');

const logger = require('winston');


//Async await functions for use in REST API engine wrapper...


var DataTransform = require("node-json-transform").DataTransform;
const _ = require('lodash')


//const QLIK_ENGINE_URL = 'ws://localhost:4848'
//'ws://ec2-54-171-150-38.eu-west-1.compute.amazonaws.com:9076


//CERT FILE
async function createQixInstance(dataSource, docid) {

    try {
        if (dataSource.type == 'qlik') {
            //Check required params exist
            if (dataSource.config.EnvironmentURL == undefined || dataSource.config.port == undefined) {

                if (dataSource.config.EnvironmentURL == undefined) {
                    var error = 'Missing EnvironmentURL in config.'
                } else if (dataSource.config.port == undefined) {
                    var error = 'Missing port in config.'
                }

                return {
                    status: "error",
                    data: error,
                    message: error
                }

            }

            //Get every combination of the filter dimensions
            const qlikconfig = {
                ca: dataSource.config.RootCert,
                key: dataSource.config.ClientKeyCert,
                cert: dataSource.config.ClientCert,
                headers: {
                    'X-Qlik-User': `UserDirectory=${encodeURIComponent(dataSource.config.UserDirectory)}; UserId=${encodeURIComponent(dataSource.config.UserAccount)}`,
                },
            };

            var startofurl = dataSource.config.secure == true ? 'wss://' : 'ws://'

            var endofurl = (docid) ? '/app/' + docid : '/app/';

            var fullurl = startofurl + dataSource.config.EnvironmentURL + ':' + dataSource.config.port + endofurl + '/identity/sharedsession123'

            // console.log(fullurl)
            // console.log(qlikconfig)

            const session = await enigma.create({
                schema,
                rejectUnauthorized: false,
                url: fullurl,
                createSocket: url => new WebSocket(url, qlikconfig),
            });

            return session;


        } else if (dataSource.type == 'qlikcloud') {

            const tenant = dataSource.config.Tenant;
            const apiKey = dataSource.config.APIKey;


            var endofurl = (docid) ? '/app/' + docid : '/app/SessionApp_testconnect';

            var fullurl = `wss://${tenant}.qlikcloud.com${endofurl}`

            console.log(fullurl)

            session = enigma.create({
                schema,
                createSocket: () => new WebSocket(fullurl, {
                    headers: { "Authorization": `Bearer ${apiKey}` }
                }),
            });


            return session;
        }

    } catch (error) {
        console.log(error)
    }

}

exports.checkConnection = async function (dataSource) {
    try {
        console.log('check connection', dataSource)
        const session = await createQixInstance(dataSource);
        //logger.info(session);
        //session.on('traffic:sent', (req) => logger.error(req));
        //session.on('notification:*', (eventName, data) => logger.error(eventName, data));

        await session.open()

        //Immediate close session
        await session.close()

        return {
            "status": "Connection Successful"
        };

    } catch (error) {

        console.log(error)
        return {
            status: "error",
            data: error,
            message: "Cannot Connect to Qlik Sense"
        };

    }
};


exports.getDocList = async function (dataSource) {

    try {

        if (dataSource.type == 'qlik') {
            // Helper function to read the contents of the certificate files:
            //const readCert = filename => fs.readFileSync(path.resolve(__dirname, '../../../', dataSource.certificate.path, filename));
            const session = await createQixInstance(dataSource);
            const qlikGlobal = await session.open();
            const docList = await qlikGlobal.getDocList()

            //Format into standard API response
            var data = {
                docs: docList
            };
            var map = {
                list: 'docs',
                item: {
                    docname: "qDocName",
                    docid: "qDocId"
                },
                each: function (item) {
                    // make changes
                    //item.iterated = true;
                    return item;
                }
            }

            var dataTransform = DataTransform(data, map);
            var result = dataTransform.transform();

            //Close Qlik Session
            await session.close();

            return result
        } else if (dataSource.type == 'qlikcloud') {

            //Use REST API to get doclist


            const docList = await axios.get(`https://${dataSource.config.Tenant}.qlikcloud.com/api/v1/items`, {
                headers: { Authorization: `Bearer ${dataSource.config.APIKey}` }
            })

            console.log(docList.data.data)


            //Format into standard API response
            var data = {
                docs: docList.data.data
            };

            var map = {
                list: 'docs',
                item: {
                    docname: "name",
                    docid: "resourceId"
                },
                each: function (item) {
                    // make changes
                    //item.iterated = true;
                    return item;
                }
            }

            var dataTransform = DataTransform(data, map);
            var result = dataTransform.transform();


            return result

        }

    } catch (error) {
        console.log(error)
        return {
            status: "error",
            data: error,
            message: "Failed to get Qlik Doclist"
        }
    }

}



exports.getFieldList = async function (dataSource, docId) {
    try {

        console.log('Start get fieldlist')
        if (docId == undefined || docId == 'null' || docId == null) {
            return 'docId is invalid.'
        }

        const session = await createQixInstance(dataSource, docId);
        const qlikGlobal = await session.open()
        const app = await qlikGlobal.openDoc(docId, '', '', '', false)

        console.log('app', app)
        const object = await app.createSessionObject({
            "qInfo": {
                "qId": "",
                "qType": "FieldList"
            },
            "qFieldListDef": {
                "qShowSystem": false,
                "qShowHidden": false,
                "qShowSemantic": false,
                "qShowSrcTables": false
            }

        })
        const layout = await object.getLayout()

        console.log('layout', layout)
        await session.close();

        //logger.info(layout);
        var data = {
            fields: layout.qFieldList.qItems
        };

        var map = {
            list: 'fields',
            item: {
                fieldname: "qName",
                type: "qTags"
            },
            each: function (item) {
                return item;
            }
        }

        var dataTransform = DataTransform(data, map);
        var result = dataTransform.transform();

        console.log('result', result)
        return result;


    } catch (error) {
        return {
            status: "error",
            data: error,
            message: "Qlik Get fieldlist failed"
        }
    }


}

exports.getValueList = async function (dataSource, fieldname, docId, measurecondition = '1') {
    try {

        if (docId == undefined || docId == 'null') {
            return 'docId is invalid.'
        }

        // logger.info(docId)

        // Helper function to read the contents of the certificate files:
        // const readCert = filename => fs.readFileSync(path.resolve(__dirname, '../../../', dataSource.certificate.path, filename));
        const session = await createQixInstance(dataSource, docId);
        const qlikGlobal = await session.open()
        const app = await qlikGlobal.openDoc(docId, '', '', '', false)
        const sessionobject = await app.createSessionObject({
            "qInfo": {
                "qType": "field-value-list",
            },
            "qHyperCubeDef": {
                "qDimensions": [{
                    qDef: {
                        qFieldDefs: [fieldname]
                    }
                }],
                "qMeasures": [{
                    qDef: {
                        qDef: measurecondition
                    },
                }],
                "qSuppressZero": true,
                "qInitialDataFetch": [{
                    "qHeight": 800,
                    "qWidth": 1,
                }]
            }
        })

        const layout = await sessionobject.getLayout();

        var data = {
            fieldvalues: layout.qHyperCube.qDataPages[0].qMatrix
        };

        var map = {
            list: 'fieldvalues',
            item: {
                text: "0.qText",
                num: "0.qNum"
            },
            each: function (item) {
                // make changes
                return item;
            }
        }

        var dataTransform = DataTransform(data, map);
        var result = dataTransform.transform();

        return result
        //return resolve(qlikobjects.qHyperCube.qDataPages[0].qMatrix)

    } catch (error) {

        return {
            status: "error",
            data: error,
            message: "Cannot get value list for field from qlik"
        }
    }


};


// exports.getMeasureList = (dataSource, triggerdata) => {
//   return new Promise(async (resolve, reject) => {
//     // Helper function to read the contents of the certificate files:
//     // const readCert = filename => fs.readFileSync(path.resolve(__dirname, '../../../', dataSource.certificate.path, filename));
//     try {

//       const session = await createQixInstance(dataSource, triggerdata.sourcedocid);
//       const qlikGlobal = await session.open()
//       const app = await qlikGlobal.openDoc(triggerdata.sourcedocid, '', '', '', false)
//       const sessionObject = await app.CreateSessionObject()
//       layout = sessionObject.layout();

//       console.log(layout)

//     } catch (error) {

//       return reject({
//         status: "error",
//         data: error,
//         message: "Qlik Get trigger results failed"
//       });

//     }
//   })

// }

exports.getTriggerResult = (dataSource, triggerdata) => {
    return new Promise(async (resolve, reject) => {
        // Helper function to read the contents of the certificate files:
        // const readCert = filename => fs.readFileSync(path.resolve(__dirname, '../../../', dataSource.certificate.path, filename));
        try {

            const session = await createQixInstance(dataSource, triggerdata.sourcedocid);
            const qlikGlobal = await session.open()
            const app = await qlikGlobal.openDoc(triggerdata.sourcedocid, '', '', '', false)

            //Confirm selections are cleared.
            await app.clearAll();

            //Apply selections to app.
            triggerdata.dimensionconditions.forEach(async (dimensioncondition, i) => {
                //Go through each dimension and apply selection...
                console.log('dim field name:', dimensioncondition.fieldname)

                var field = await app.getField(dimensioncondition.fieldname).then((field) => {
                    field.selectValues([{ qText: dimensioncondition.value }], false, true)
                })

                //  await field.selectValues([{ qText: dimensioncondition.value }], true, true)
                // console.log('field selection applied.')

            })

            let returnValue = [];

            triggerdata.measureconditions.forEach(async (measurecondition, i) => {

                console.log('calculate measure')
                let dimensionsetanalysis = '';
                let finalexpression = '';

                //Check if it is in simple  or custom mode.
                if (measurecondition.measuremode == 'simple') {


                    let measureaggr = measurecondition.type == 'count_distinct' ? 'count(distinct ' : measurecondition.type + '(';
                    finalexpression = "=" + measureaggr + "[" + measurecondition.fieldname + "])";
                } if (measurecondition.measuremode == 'library') {


                } else {


                    finalexpression = measurecondition.custommeasurequery;
                }

                // //Expression trigger result
                const object = await app.createObject({
                    qInfo: {
                        qType: 'StringExpression',
                    },
                    expr: {
                        qStringExpression: {
                            qExpr: finalexpression
                        }
                    }
                });

                const layout = await object.getLayout();
                //await app.clear();

                // await session.close();

                returnValue.push({
                    measureid: measurecondition.id,
                    value: Number(layout.expr),
                })


                // returnValue.push({
                //   measureid: measurecondition.id,
                //   value: 1,
                // })

                //on last one push result
                if (i == triggerdata.measureconditions.length - 1) {
                    resolve(returnValue)
                }

            })


        } catch (error) {
            console.log(error)
            return reject({
                status: "error",
                data: error,
                message: "Qlik Get trigger results failed"
            });

        }
    })

}



exports.getTriggerMessage = (dataSource, triggerdata) => {
    return new Promise(async (resolve, reject) => {
        // Helper function to read the contents of the certificate files:
        // const readCert = filename => fs.readFileSync(path.resolve(__dirname, '../../../', dataSource.certificate.path, filename));
        try {
            console.log(triggerdata)

            const session = await createQixInstance(dataSource, triggerdata.sourcedocid);
            const qlikGlobal = await session.open()
            const app = await qlikGlobal.openDoc(triggerdata.sourcedocid, '', '', '', false)

            //Confirm selections are cleared.
            await app.clearAll();

            //Apply selections to app.
            triggerdata.dimensionconditions.forEach(async (dimensioncondition, i) => {
                //Go through each dimension and apply selection...

                var field = await app.getField(dimensioncondition.fieldname).then((field) => {
                    field.selectValues([{ qText: dimensioncondition.value }], false, true)
                })


            })


            //Expression trigger result
            const object = await app.createObject({
                qInfo: {
                    qType: 'StringExpression',
                },
                expr: {
                    qStringExpression: {
                        qExpr: triggerdata.triggerMessage
                    }
                }
            });

            const layout = await object.getLayout();
            //await app.clear();

            console.log('Message Output', layout.expr)

            //await session.close();

            return resolve(layout.expr);


        } catch (error) {
            return reject({
                status: "error",
                data: error,
                message: "Qlik Get trigger results failed"
            });

        }
    })

}



exports.runExtract = async function (dataSource, kpi) {
    return new Promise(async (resolve, reject) => {
        try {



            logger.info('Run extract started')
            function createHypercubeDef(app, dims) {
                return new Promise((resolve, reject) => {


                    //Get number of dims -1
                    const lastitemindex = dims.length - 1

                    //For each dim format hypercube DEF
                    const qDimensions = dims.map((dim, index) => ({
                        qDef: {
                            qFieldDefs: [dim],
                            "qSortCriterias": [{
                                "qSortByNumeric": -1
                            }]
                        },
                        "qOtherTotalSpec": {
                            "qTotalMode": index == lastitemindex ? "TOTAL_OFF" : "TOTAL_EXPR"
                        },
                        "qNullSuppression": true,
                        "qTotalLabel": "All"
                    }))

                    /*
                    qDimensions.forEach(dim => {
                      logger.info(dim.qDef.qFieldDefs)
                    })
          */


                    //Final props definition for Qlik hypercube (pivot)
                    const properties = {
                        qInfo: {
                            qType: 'my-pivot-hypercube',
                        },
                        qHyperCubeDef: {
                            qDimensions,
                            qMeasures: [{
                                qDef: {
                                    qDef: kpi.measureexpression
                                },
                            }],
                            qMode: 'EQ_DATA_MODE_PIVOT',
                            qAlwaysFullyExpanded: true,
                            qNoOfLeftDims: dims.length - 1
                        },
                    };

                    //logger.info('Hypercube props:');
                    //logger.info(properties);
                    return resolve(properties);

                })
            }



            function formatHypercubeForStorage(array, dims) {
                return new Promise((resolve, reject) => {

                    const {
                        qLeft,
                        qData,
                        qTop
                    } = array

                    logger.info('Generated array')
                    //logger.info(array)


                    //Flatten pivot array
                    const objectHasSubNodes = (object) => object.hasOwnProperty('qSubNodes') ? object.qSubNodes.length ? object.qSubNodes : false : false

                    // i = dims.length - 1 (qLeft SubNodes Depth Level)
                    const handleNestedSubNodes = (array, dims, i) => {
                        const result = array.map(subNode => {
                            const objectSubNodes = objectHasSubNodes(subNode)
                            if (objectSubNodes) {
                                return handleNestedSubNodes(objectSubNodes.map($subNode => {
                                    if (i > 0 && subNode[dims[i - 1]])
                                        return {
                                            ...$subNode,
                                            [dims[i]]: subNode.qText,
                                            [dims[i - 1]]: subNode[dims[i - 1]]
                                        }
                                    else
                                        return {
                                            ...$subNode,
                                            [dims[i]]: subNode.qText
                                        }
                                }), dims, i + 1)
                            } else
                                return subNode
                        })
                        return result
                    }


                    // logger.info('qleft', qLeft);
                    // logger.info('dims', dims)


                    // Expand qLeft to the last qSubNodes array
                    const sites = _.flattenDeep(handleNestedSubNodes(qLeft, dims, 0)) // leaking problem here.....

                    const result = sites.map((site, siteIndex) => {
                        const labels = []
                        const data = []
                        let absolutenumber, colorexpression, previousPeriodValue, latestPeriodValue, percentagenumber
                        qTop.forEach((dimension, qTopIndex) => {
                            labels.push(dimension)
                            data.push(qData[siteIndex][qTopIndex])
                            qData[siteIndex][qTopIndex].qNum = isNaN(qData[siteIndex][qTopIndex].qNum) ? 0 : qData[siteIndex][qTopIndex].qNum
                            const lastQDataItem = isNaN(qData[siteIndex][0].qNum) ? 0 : qData[siteIndex][0].qNum
                            const secondLastQDataItem = qData[siteIndex][1] ? isNaN(qData[siteIndex][1].qNum) ? 0 : qData[siteIndex][1].qNum : 0

                            percentagenumber = (lastQDataItem == 0) ? 'NA' : (lastQDataItem - secondLastQDataItem) / secondLastQDataItem
                            absolutenumber = lastQDataItem
                            //colorexpression = percentagenumber < 0 ? 'red' : percentagenumber > 0 ? 'green' : "gray"
                        })

                        var timeframe = dims[dims.length - 1];


                        // previousPeriodValue = data[data.length - 2]
                        // previousPeriodValue = Math.round(previousPeriodValue * 10) / 10;
                        // previousPeriodValue = +previousPeriodValue.toFixed(2);

                        // latestPeriodValue = data[data.length - 1]
                        // latestPeriodValue = Math.round(latestPeriodValue * 10) / 10;
                        // latestPeriodValue = +latestPeriodValue.toFixed(2);


                        // percentagenumber = (latestPeriodValue-previousPeriodValue) / previousPeriodValue
                        // percentagenumber =  Math.round(percentagenumber * 10) / 10;
                        // percentagenumber = +percentagenumber.toFixed(2);


                        const $site = {
                            timeframe,
                            dims,
                            linedata: {
                                labels,
                                data
                            },
                            absolutenumber,
                            percentagenumber,
                            colorexpression,
                            qText: site.qText
                        }

                        // logger.info(site);

                        $site.dims.forEach((dim, i) => {
                            if (i < $site.dims.length - 2) {

                                if (site[dim]) {
                                    //Here??
                                    $site[dim] = site[dim];
                                }

                            } else {
                                if (site.qText) {
                                    $site[dim] = site.qText
                                }
                            }
                        })
                        delete $site.qText
                        delete $site[timeframe]


                        return $site

                    })

                    dims.pop()
                    return resolve(result)



                })
            }

            let session = await createQixInstance(dataSource, kpi.sourcedocid);
            let qlikGlobal = await session.open()
            let app = await qlikGlobal.openDoc(kpi.sourcedocid, '', '', '', false)

            var storagedata = [];
            //       //logger.info('Measure expresssion:')
            //       //logger.info(kpi)

            //       //Function to handle async for each timeframe
            async function asyncForEach(array, callback) {
                for (let index = 0; index < array.length; index++) {
                    await callback(array[index], index, array);
                }
            }

            //loop through each timeframe and run qlik query async
            const start = async () => {
                await asyncForEach(kpi.timeframeDims, async (timeframe) => {
                    const dimsarray = [...kpi.dims];
                    // console.log('dimsarray 1---> ', kpi.dims);
                    // console.log('timeframe ---> ', timeframe);
                    // console.log('kpi.id ---> ', kpi.id);
                    // console.log('kpi.timeframeDims ---> ', kpi.timeframeDims);
                    //For each timeframe generate a hypercube def and pull data from qlik app.
                    logger.info('Start Qlik Query for ' + timeframe)
                    //Add the timeframe to the end

                    dimsarray.push(timeframe)
                    // console.log('dimsarray 2---> ', dimsarray);

                    let hypercubeDef = await createHypercubeDef(app, dimsarray, kpi.measureexpression);
                    //   //logger.info('hypercube def', hypercubeDef);
                    let object = await app.createSessionObject(hypercubeDef);
                    delete dimsarray;

                    const layout = await object.getHyperCubePivotData('/qHyperCubeDef', [{
                        qTop: 0,
                        qLeft: 0,
                        qHeight: 1000,
                        qWidth: 100
                    }])

                    //logger.info('Hypercube result',layout[0].qData);
                    //logger.info('row val',layout[0].qData[0][0].qText);
                    if (layout[0].qData.length == 1 && layout[0].qData[0][0].qText == '-') {
                        throw new Error('KPI returns no data: ' + kpi.name)
                    }

                    const storagedataloop = await formatHypercubeForStorage(layout[0], dimsarray);

                    Array.prototype.push.apply(storagedata, storagedataloop);

                });
                logger.info('All Timeframes Processed.');
                // //logger.info('storage data!', storagedata);

            }

            await start();

            await session.close();
            logger.info('Run extract Ended')

            delete session;
            delete app;
            delete qlikGlobal;
            delete hypercubeDef;
            delete object;
            delete createHypercubeDef;

            return resolve(storagedata);

        } catch (error) {
            // console.log('error ----->', error);

            return reject({
                status: "error",
                data: error,
                message: "Failed to extract KPI Data for " + kpi.name
            });

        } finally {
            // console.log('\x1b[33m%s\x1b[0m', 'GC Started..');
            // if (global.gc) global.gc();
        }

    })
}