/* eslint no-console:0, import/no-unresolved:0 */
const Registry = require('../../dist/enigma');

const cfg = {
  unsecure: true,
  host: '127.0.0.1',
  port: 4848,
  services: [{ id: 'capability', version: 'v1' }],
};

Registry.getService('rest', cfg).then((services) => {
  console.log(services.capability.apis.help());
  return services.capability.apis.default.get_v1_list().then((result) => {
    console.log('Capabilities', result.obj);
  });
}).catch((err) => {
  console.log('Error fetching REST service:', err);
  process.exit();
});
