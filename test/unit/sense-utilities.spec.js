import SenseUtilities from '../../src/sense-utilities';

describe('Sense Utilities', () => {
  let config;

  beforeEach(() => {
    config = {};
  });

  it('should set secure by default', () => {
    SenseUtilities.configureDefaults(config);
    expect(config.secure).to.equal(true);
  });

  it('should convert unsecure parameter to secure if the secure parameter is not set', () => {
    config.unsecure = false;
    SenseUtilities.configureDefaults(config);
    expect(config.secure).to.equal(true);
  });

  it('should give secure precedence', () => {
    config.secure = true;
    config.unsecure = true;
    SenseUtilities.configureDefaults(config);
    expect(config.secure).to.equal(true);
  });

  it('should build an url depending on config', () => {
    expect(SenseUtilities.buildUrl({ secure: true })).to.equal('wss://localhost/app/engineData');
    expect(SenseUtilities.buildUrl({ secure: true, appId: 'myApp1' })).to.equal('wss://localhost/app/myApp1');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 666,
      appId: 'myApp3',
    })).to.equal('wss://localhost:666/app/myApp3');
    expect(SenseUtilities.buildUrl({
      secure: true,
      host: 'foo.com',
      appId: 'myApp3',
    })).to.equal('wss://foo.com/app/myApp3');
    expect(SenseUtilities.buildUrl({
      secure: false,
      host: 'foo.com',
      appId: 'myApp3',
    })).to.equal('ws://foo.com/app/myApp3');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 666,
      route: 'myroute',
    })).to.equal('wss://localhost:666/myroute');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 666,
      route: '/myroute',
    })).to.equal('wss://localhost:666/myroute');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 666,
      route: 'myroute/',
    })).to.equal('wss://localhost:666/myroute');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 666,
      route: '/my/route/',
    })).to.equal('wss://localhost:666/my/route');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      appId: 'myApp4',
    })).to.equal('wss://localhost:4848/myproxy/app/myApp4');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      urlParams: {
        reloadUri: 'http://qlik.com',
      },
      appId: 'myApp6',
    })).to.equal('wss://localhost:4848/myproxy/app/myApp6?reloadUri=http%3A%2F%2Fqlik.com');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      urlParams: {
        reloadUri: 'http://qlik.com',
      },
      identity: 'migration-service',
      appId: 'myApp7',
    })).to.equal('wss://localhost:4848/myproxy/app/myApp7/identity/migration-service?reloadUri=http%3A%2F%2Fqlik.com');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      prefix: '/myproxy/',
      subpath: 'dataprepservice',
      appId: 'myApp8',
    })).to.equal('wss://localhost:4848/myproxy/dataprepservice/app/myApp8');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      urlParams: {
        qlikTicket: 'abcdefg123456',
      },
      appId: 'myApp9',
    })).to.equal('wss://localhost:4848/app/myApp9?qlikTicket=abcdefg123456');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      urlParams: {
        reloadUri: 'http://qlik.com',
        qlikTicket: 'abcdefg123456',
      },
      appId: 'myApp10',
    })).to.equal('wss://localhost:4848/app/myApp10?reloadUri=http%3A%2F%2Fqlik.com&qlikTicket=abcdefg123456');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      reloadURI: 'http://community.qlik.com',
      urlParams: {
        reloadUri: 'http://qlik.com',
        qlikTicket: 'abcdefg123456',
      },
      appId: 'myApp11',
    })).to.equal('wss://localhost:4848/app/myApp11?reloadUri=http%3A%2F%2Fqlik.com&qlikTicket=abcdefg123456');
    expect(SenseUtilities.buildUrl({
      secure: true,
      port: 4848,
      reloadURI: 'http://community.qlik.com',
      urlParams: {
        reloadUri: 'http://qlik.com',
        qlikTicket: 'abcdefg123456',
      },
      ttl: 1000,
      appId: 'myApp11',
    })).to.equal('wss://localhost:4848/app/myApp11/ttl/1000?reloadUri=http%3A%2F%2Fqlik.com&qlikTicket=abcdefg123456');
  });
});
