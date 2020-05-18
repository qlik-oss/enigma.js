const https = require('https');
const fs = require('fs');

const xrfKey = 'abcdefghijklmnop';

module.exports = {
  // Your Sense Enterprise installation hostname
  host: 'localhost',
  // Listening port of the Qlik Sense Enterprise proxy
  proxyPort: 4243,
  // Name of virtualProxy to be used (begin with '/')
  virtualProxy: '',
  // 'engineData' is a special "app id" that indicates you only want to use the global
  appId: 'engineData',
  // The Sense Enterprise-configured user directory for the user you want to identify as:
  userDirectory: 'your-sense-user-directory',
  // The user to use when creating the session:
  userId: 'your-sense-user',
  // URL to the QPS there the ticket is retrived
  ticketURL() { return `https://${this.host}:${this.proxyPort}/qps${this.virtualProxy}/ticket?xrfkey=${xrfKey}`; },
  // Body sent in the ticket request
  ticketReqBody() {
    return {
      UserDirectory: this.userDirectory,
      UserId: this.userId,
      Attributes: [],
      TargetId: '',
    };
  },
  // Config used for the ticket request
  ticketReqConfig: {
    headers: {
      'Content-Type': 'application/json',
      'X-Qlik-Xrfkey': xrfKey,
    },
    httpsAgent: new https.Agent({
      ca: [fs.readFileSync('./root.pem')],
      key: fs.readFileSync('./client_key.pem'),
      cert: fs.readFileSync('./client.pem'),
      // passphrase: "secret",
    }),
  },
};
