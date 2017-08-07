/* eslint no-console: 0, no-loop-func: 0, import/no-unresolved: 0, no-restricted-globals: 0 */

const WebSocket = require('ws');
const heapdump = require('heapdump');
const enigma = require('../../enigma');
const schema = require('../../schemas/12.20.0.json');

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
    async function cleanup(session, err) {
      if (err) {
        console.error(err);
      }

      await session.close();

      if (enableHeap) {
        heapdump.writeSnapshot(`./${stamp}-iteration-${iterationNumber}.heapsnapshot`);
      }
    }

    const session = enigma.create({
      schema,
      url: 'ws://localhost:9076/app/engineData',
      createSocket: url => new WebSocket(url, { headers: { 'X-Qlik-Session': iterationNumber } }),
    });

    async function createObject(doc, objectNumber) {
      const obj = await doc.createObject({ qInfo: { qType: 'test' }, test: objectNumber });
      const props = await obj.getProperties();
      props.test = objectNumber + iterationNumber;
      await obj.setProperties(props);
      await obj.getProperties();
      return doc.destroyObject(obj.id);
    }


    try {
      const global = await session.open();
      const doc = await global.createSessionApp();
      const promises = [];

      for (let j = 0; j < objIterations; j += 1) {
        promises.push(createObject(doc, j));
      }

      await Promise.all(promises);
      await cleanup(session);
    } catch (err) {
      await cleanup(session, err);
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
