/* eslint no-console: 0, no-loop-func: 0, import/no-unresolved: 0 */

const WebSocket = require('ws');
const heapdump = require('heapdump');
const enigma = require('../../dist/enigma');
const schema = require('../../schemas/qix/3.2/schema.json');

const enableHeap = process.argv.indexOf('--enable-heap') > -1;

// if we're doing heap dump only run a few documents:
const docIterations = enableHeap ? 5 : 50;
const objIterations = 100;
const stamp = Date.now();

if (enableHeap) {
  heapdump.writeSnapshot(`./${stamp}-baseline.heapsnapshot`);
}

let i = -1;

async function next() {
  i += 1;

  if (i === docIterations) {
    return;
  }

  async function run(iterationNumber) {
    async function cleanup(global, err) {
      if (err) {
        console.error(err);
      }

      await global.session.close();

      if (enableHeap) {
        heapdump.writeSnapshot(`./${stamp}-iteration-${iterationNumber}.heapsnapshot`);
      }
    }

    const qix = await enigma.connect({
      schema,
      session: {
        host: 'localhost',
        port: 4848,
        secure: false,
      },
      createSocket: url => new WebSocket(url, { headers: { 'X-Qlik-Session': iterationNumber } }),
      listeners: { 'qix-error': err => console.error(err) },
    });

    async function createObject(doc, objectNumber) {
      const obj = await doc.createObject({ qInfo: { qType: 'test' }, test: objectNumber });
      const props = await obj.getProperties();
      props.test = objectNumber + iterationNumber;
      await obj.setProperties(props);
      await obj.getProperties();
      return await doc.destroyObject(obj.id);
    }


    try {
      const doc = await qix.global.createSessionApp();
      const promises = [];

      for (let j = 0; j < objIterations; j += 1) {
        promises.push(createObject(doc, j));
      }

      await Promise.all(promises);
      await cleanup(qix.global);
    } catch (err) {
      await cleanup(qix.global, err);
    }
  }
  if (enableHeap) {
    await run(i);
    next();
  } else {
    run(i);
    next();
  }
}

next();
