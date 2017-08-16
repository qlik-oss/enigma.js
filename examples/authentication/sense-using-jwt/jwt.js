const enigma = require('enigma.js');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const schema = require('enigma.js/schemas/12.20.0.json');

// The WebSocket URL to your Sense Enterprise installation:
const engineUrl = 'wss://example.domain/proxy-jwt/app/engineData';

// The Sense Enterprise-configured user directory for the user you want to identify
// as:
const userDirectory = 'your-sense-user-directory';

// The user to use when creating the session:
const userId = 'your-sense-user';

// The Sense Enterprise-configured JWT structure. Change the attributes to match
// your configuration:
const token = {
  directory: userDirectory,
  user: userId,
};

// Path to the private key used for JWT signing:
const privateKeyPath = './keys/private.key';
const key = fs.readFileSync(path.resolve(__dirname, privateKeyPath));

// Sign the token using the RS256 algorithm:
const signedToken = jwt.sign(token, key, { algorithm: 'RS256' });

const config = {
  schema,
  url: engineUrl,
  // Notice how the signed JWT is passed in the 'Authorization' header using the
  // 'Bearer' schema:
  createSocket: url => new WebSocket(url, {
    headers: { Authorization: `Bearer ${signedToken}` },
  }),
};

const session = enigma.create(config);

session.open().then((global) => {
  console.log('Session was opened successfully');
  return global.getDocList().then((list) => {
    const apps = list.map(app => `${app.qDocId} (${app.qTitle || 'No title'})`).join(', ');
    console.log(`Apps on this Engine that the configured user can open: ${apps}`);
    session.close();
  });
}).catch(error => console.log('Failed to open session and/or retrieve the app list:', error));
