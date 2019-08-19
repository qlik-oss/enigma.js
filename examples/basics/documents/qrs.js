const enigma = require('enigma.js');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const https = require('https');
const path = require('path');
const fs = require('fs');

const schema = require('enigma.js/schemas/12.20.0.json');

// Your Sense Enterprise installation hostname:
const senseHost = 'localhost';

// Your configured virtual proxy prefix for JWT authentication:
const proxyPrefix = 'jwt';

// The Sense Enterprise-configured user directory for the user you want to identify
// as:
const userDirectory = 'your-sense-user-directory';

// The user to use when creating the session:
const userId = 'your-sense-user';

// Read private key from disk, and create the signed JWT:
const key = fs.readFileSync(path.resolve(__dirname, './private.key'));
const token = jwt.sign({ directory: userDirectory, user: userId }, key, { algorithm: 'RS256' });

// These are the common request options needed when talking against the Sense
// Enterprise installation from Node.js:
const requestOptions = {
  // Toggle this to true if you are _not_ using self-signed certificates:
  rejectUnauthorized: false,
  headers: {
    // We inject our JWT token here:
    Authorization: `Bearer ${token}`,
  },
};

// eslint-disable-next-line no-restricted-globals
const getAppsFromQRS = () => new Promise((resolve, reject) => {
  const xrfKey = 'abcdefghijklmnop';
  const xhrOptions = {
    ...requestOptions,
    host: senseHost,
    path: `/${proxyPrefix}/qrs/app?xrfkey=${xrfKey}`,
  };
  xhrOptions.headers['X-Qlik-Xrfkey'] = xrfKey;
  const req = https.request(xhrOptions, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', () => resolve(JSON.parse(data)));
  });
  req.on('error', reject);
  req.end();
});

const openFirstApp = (apps) => {
  if (!apps.length) {
    console.log('No apps available, make sure your userDirectory and userId configuration is correct both in the script and in QMC attribute mapping.');
    // eslint-disable-next-line no-restricted-globals
    return Promise.reject(new Error('No available apps'));
  }
  console.log('Available apps for this user:', apps.map((app) => `${app.id} (${app.name})`).join(', '));
  const firstAppId = apps[0].id;
  return enigma.create({
    schema,
    // We use the configured proxyPrefix here to make sure Sense uses the correct
    // authentication:
    url: `wss://${senseHost}/${proxyPrefix}/app/${firstAppId}`,
    // Please notice the requestOptions parameter when creating the websocket:
    createSocket: (url) => new WebSocket(url, requestOptions),
  }).open().then((global) => global.openDoc(firstAppId)).then((app) => {
    console.log(`Opened app ${app.id}`);
    app.session.close();
  });
};

getAppsFromQRS().then(openFirstApp).catch((error) => {
  console.log('Something went wrong :(', error);
  process.exit(1);
});
