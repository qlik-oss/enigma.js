var port = 443;
const path = require('path');
var cors = require('cors')
//var sslRedirect = require('heroku-ssl-redirect');
const helmet = require('helmet')
var https = require('https');
const fs = require('fs');

// var privateKey = fs.readFileSync('server/sslcerts/privateKey.key', 'utf8');
// var certificate = fs.readFileSync('server/sslcerts/certificate.crt', 'utf8');

var credentials = { key: privateKey, cert: certificate };

if (!process.env.ENV_TYPE) {
    //Uncomment for running locally
    require('dotenv').config()

}

const logger = require('./debug').logger();
const express = require('express')
var app = module.exports = express();

const routes = require('./routes');

var bodyParser = require('body-parser');

// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(cors())

//app.use(sslRedirect());
app.use(helmet.frameguard())

//Need to remove db stuff.

async function startUp() {

    //Establish DB connection.
    const connection = await require('../dbConn')
    const db = connection.db
    const client = connection.client

    //Set DB conn in app instance
    app.set('db', db);
    app.set('client', client);

    app.use('/', routes);


    var server = https.createServer({}, app);

    server.listen(port, () => logger.info(`Qlik REST server listening on port ${port} woop!`))

}


startUp()