const crypto = require('crypto')
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const express = require('express');
const router = express.Router();
const qlikCommands = require('./qlikCommands');

Date.prototype.addHours = function (h) {
  this.setHours(this.getHours() + h);
  return this;
}

//Needs mongodb conns removed.

router.get('/retrieve/:datasourceId', async function (req, res, next) {

  //Get KPI Data
  try {

    //Connect to user specific DB...
    const userId = req.user._id.toString()
    //console.log('the user', userId);
    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    // console.log(req.params.measureId)
    //Retrieve one measure
    const datasource = await uniqueUserDB.collection('datasource').findOne({ _id: ObjectID(req.params.datasourceId) })

    client.close();

    res.json(datasource);


  } catch (error) {
    console.error('Retrieve datasource error', error)
    res.status(503).json(error)
  }

})



//Get full list of datasources
router.get('/', async function (req, res, next) {

  //Get KPI Data
  try {

    //Define DB Connection.
    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    //Retrieve all measure data
    const datasources = await uniqueUserDB.collection('datasource').find({}).toArray()

    res.json(datasources);

    client.close();

  } catch (error) {
    res.status(402).json(error)
  }

})


//Update datasource
router.patch('/:datasourceId', async function (req, res, next) {

  try {

    //Retrieve User ID...
    console.log('Update datasource')
    const userId = req.user._id.toString()
    // console.log('the user', userId);
    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    // console.log(req.params.measureid)
    // console.log(req.body)
    const myquery = { _id: ObjectID(req.params.datasourceId) }
    const updatevals = req.body

    //Remove _id field from the body if present to avoid mongo error..
    delete updatevals._id;
    const newvalues = { $set: updatevals }


    //Add measure to the DB...
    //Add measure Record...
    const updateDatasource = await uniqueUserDB.collection('datasource').updateOne(myquery, newvalues)
    console.log(updateDatasource)
    // console.log(updateMeasure)
    // console.log(updateMeasure)
    if (updateDatasource.modifiedCount == 1) {
      //measure has been modified.
      const datasource = await uniqueUserDB.collection('datasource').findOne({ _id: ObjectID(req.params.datasourceId) })
      //Close connection.
      client.close();

      //Recalculate predictive forecast via worker.
      // generateMeasureData.createMeasureProcess('quickbooksTemplate', userId, "updateForecast", req.params.measureid)



      res.json(datasource)

    } else {
      res.status(502).send("Could not update datasource.")

    }

  } catch (error) {

    //Check if duplicate email...
    console.error('patch datasource error', error)
    res.status(502).send(error)

  }



})

router.delete('/:datasourceId', async function (req, res) {

  try {

    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');
    //remove datasource from database...
    const datasource = await uniqueUserDB.collection('datasource').deleteOne({ _id: ObjectID(req.params.datasourceId) })

    res.json({ message: "Datasource deleted" })

  } catch (error) {
    console.log(error)
    //Check if duplicate email...
    req.logger.error('Delete datasource Error', error)
    res.status(502).send(error)

  }

})


router.post('/', expressTimber, async function (req, res, next) {

  try {

    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    //Add  Record...
    const newDataSource = await uniqueUserDB.collection('datasource').insertOne({
      "name": req.body.name,
      "type": req.body.type,
      "config": req.body.config
    })

    res.json(newDataSource.ops[0])
    client.close();

  } catch (error) {
    console.log(error)
    //Check if duplicate email...
    req.logger.error('New datasource Error', error)
    res.status(502).send(error)

  }



})



router.get('/checkconnection/:datasourceId', expressTimber, async function (req, res, next) {

  try {

    //Retrieve datasource record..

    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    // console.log(req.params.measureId)
    //Retrieve one measure
    const datasource = await uniqueUserDB.collection('datasource').findOne({ _id: ObjectID(req.params.datasourceId) })

    var result = await qlikCommands.checkConnection(datasource)
    console.log('result', result)
    res.json({ status: result.status, error: result.error, message: result.message })

  } catch (error) {

    req.logger.error({ message: 'Check connection error', error: error })
    res.json(error)
    // res.status(503).json(error)
  }

})

router.get('/doclist/:datasourceId', expressTimber, async function (req, res, next) {

  try {

    //Retrieve datasource record..

    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    // console.log(req.params.measureId)
    //Retrieve one measure
    const datasource = await uniqueUserDB.collection('datasource').findOne({ _id: ObjectID(req.params.datasourceId) })



    var result = await qlikCommands.getDocList(datasource)


    res.json(result)

  } catch (error) {

    req.logger.error({ message: 'Get doclist error', error: error })

    //  res.status(503).json(error)
  }

})

router.post('/fieldlist', expressTimber, async function (req, res, next) {

  try {

    const datasourceId = req.body.datasourceId
    const docId = req.body.docId

    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    // console.log(req.params.measureId)
    //Retrieve one measure
    const datasource = await uniqueUserDB.collection('datasource').findOne({ _id: ObjectID(datasourceId) })


    var result = await qlikCommands.getFieldList(datasource, docId)



    res.json(result)

  } catch (error) {

    console.log(error)
    req.logger.error({ message: 'Get fieldlist error', error: error })

    //  res.status(503).json(error)
  }

})

router.post('/valuelist', expressTimber, async function (req, res, next) {

  try {

    //:datasourceId
    const datasourceId = req.body.datasourceId
    const docId = req.body.docId
    const fieldName = req.body.fieldName


    const client = await MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true });
    const uniqueUserDB = await client.db('clientdb1');

    // console.log(req.params.measureId)
    //Retrieve one measure
    const datasource = await uniqueUserDB.collection('datasource').findOne({ _id: ObjectID(datasourceId) })

    var result = await qlikCommands.getValueList(datasource, fieldName,docId)

    res.json(result)

  } catch (error) {

    console.log(error)
    req.logger.error({ message: 'Get fieldlist error', error: error })

    //  res.status(503).json(error)
  }

})





module.exports = router;