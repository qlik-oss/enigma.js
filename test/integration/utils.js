import Promise from 'bluebird';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process'; // eslint-disable-line camelcase

const installationPrefix = 'c:/ProgramData/Qlik/Sense/Repository/Exported Certificates/.Local Certificates/';
const hostCfgPath = '../../../host.cfg';
const getService = "wmic service where name='QlikSenseEngineService' get started | MORE +1";
const getArguments = "wmic path win32_process where name='Engine.exe' get commandline | MORE +1";

export default {
  getDefaultConfig() {
    return Promise.all([
      this.execCmd(getService),
      this.execCmd(getArguments),
      this.getHost(),
    ]).then((result) => {
      const isServer = !!(result[0] || result[1].indexOf('-F -D') >= 0);
      const isInstalled = !!result[0];
      const host = result[2];
      const port = isServer ? 4747 : 4848;
      const protocol = isServer ? 'wss' : 'ws';
      const certificates = isServer ? this.getCertificates() : {};

      return {
        isServer,
        isInstalled,
        url: `${protocol}://${host}:${port}/app/engineData`,
        socket: {
          ca: certificates.ca,
          cert: certificates.cert,
          key: certificates.key,
          headers: {
            'X-Qlik-User': `UserDirectory=${process.env.USERDOMAIN};UserId=${process.env.USERNAME}`,
          },
        },
      };
    });
  },
  fileExists(filePath) {
    return new Promise((resolve) => {
      fs.lstat(filePath, (err) => {
        resolve(!err);
      });
    });
  },
  getHost() {
    return new Promise((resolve) => {
      const hostCfg = path.resolve(installationPrefix, hostCfgPath);

      return this.fileExists(hostCfg).then((exists) => {
        if (exists) {
          resolve(new Buffer(fs.readFileSync(path.resolve(hostCfg)).toString(), 'base64').toString());
        } else {
          // resolve( (process.env.computername + "." + process.env.userdnsdomain).toLowerCase() );
          resolve('localhost');
        }
      });
    });
  },
  getScript(fileName) {
    return new Promise((resolve, reject) => {
      const filePath = path.resolve(__dirname, 'load-scripts', fileName);

      return this.fileExists(filePath).then((exists) => {
        if (exists) {
          resolve(fs.readFileSync(filePath).toString());
        } else {
          reject();
        }
      });
    });
  },
  getCertificates() {
    return {
      ca: [fs.readFileSync(path.resolve(installationPrefix, 'root.pem'))],
      cert: fs.readFileSync(path.resolve(installationPrefix, 'client.pem')),
      key: fs.readFileSync(path.resolve(installationPrefix, 'client_key.pem')),
    };
  },
  execCmd(cmd) {
    return new Promise((resolve) => {
      child_process.exec(cmd, (error, stdout) => { // eslint-disable-line camelcase
        resolve(stdout.trim());
      });
    });
  },
};
