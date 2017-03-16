import OpenAPI from 'swagger-client';
import HttpClient from './http-client';

/**
* The enigma REST service options.
*
* @typedef RestOptions
* @prop {Object} Promise The ES6-compatible Promise-implementation to use.
* @prop {String} host The host to connect against.
* @prop {String} [port] The port to connect against, defaults to 80 for HTTP, 443 for HTTPS.
* @prop {Object} [headers] Additional headers to inject for each request.
* @prop {Array.RestMixin} [mixins] Mixins to use.
* @prop {Array.<RestServiceConfig>} [services] An array of RestServiceConfig's.
* @prop {Boolean} [secure] Whether to use HTTPS, defaults to true.
* @prop {CertificateOptions} [certs] The certificates to use, required when using
*                                    HTTPS and running in Node.
* @prop {Object} [httpModule] HTTP module to use, should only be used for testing.
* @prop {Object} [HttpClient] Swagger.js-compatible HTTP Client to use, should only
*                             be used for testing.
*/

/**
* The mixin specification.
*
* @typedef RestMixin
* @prop {string} service Which service the mixin applies to.
* @prop {Function} [init] The callback to invoke when the service is instantiated.
* @prop {Object} [extend] An object with new, extending methods.
* @prop {Object} [override] An object with existing, overwriting methods.
*/

/**
* Configuration for a specific REST service.
*
* @typedef RestServiceConfig
* @prop {String} id The id of the service, this is mapped to the URL of the service,
*                   e.g. /api/capability/ would have the id `capability`.
* @prop {String} [version] What version of the API to use, e.g. `v2`. Either this
*                          or `url` needs to be set. This has precedent over `url`.
* @prop {Object} [url] An absolute path, e.g. `/api/myservice/openapi.json`, to
*                      the OpenAPI definition of the service. Either this
*                      or `version` needs to be set. This will not be used if `version` is set.
*/

/**
* Configuration for certificates.
*
* @typedef CertificateOptions
* @prop {Array} ca An array of root certificates to validate against.
* @prop {Buffer} cert The client certificate to use.
* @prop {Buffer} key The client key to use.
*/

export default class Rest {
  static validateRestOptions(restOptions) {
    if (!restOptions.Promise && typeof Promise === 'undefined') {
      throw new Error('Your environment has no Promise implementation. You must provide a Promise implementation in the config.');
    }

    if (!restOptions.host) {
      throw new Error('You must provide a host in the config');
    }

    if (restOptions.services) {
      restOptions.services.forEach((svc) => {
        if (!svc.id) {
          throw new Error('You must provide a service id in the config');
        }
        if (!svc.version && !svc.url) {
          throw new Error(`You must provide either an API version, or the URL to an OpenAPI definition for service ${svc.id}, in the config`);
        }
      });

      const dupes = restOptions.services.map(svc => svc.id).filter((id, i, arr) =>
        arr.lastIndexOf(id) !== i
      );

      if (dupes.length) {
        throw new Error(`Service ID needs to be unique in config, duplicate entries of these ID's: ${dupes.join(', ')}`);
      }
    }

    /* istanbul ignore next */
    restOptions.Promise = restOptions.Promise || Promise;

    // Optional: certs, headers, mixins, secure
  }

  static generateOpenAPIConfig(serviceConfig, rootUrl) {
    const cfg = Object.assign({}, serviceConfig);

    if (typeof cfg.enableCookies === 'undefined') {
      cfg.enableCookies = true;
    }

    cfg.usePromise = true;
    cfg.url = `${rootUrl}${cfg.id}/${cfg.version}/openapi`;

    return cfg;
  }

  static generateRootUrl(restOptions) {
    let url = `${restOptions.secure ? 'https' : 'http'}://${restOptions.host}`;

    if (restOptions.port) {
      url += `:${restOptions.port}`;
    }

    if (restOptions.prefix) {
      url += `/${restOptions.prefix}`;
    }

    url += `/${restOptions.subpath || 'api'}/`;

    return url;
  }

  static createHttpClient(serviceOpts, restOpts) {
    /* istanbul ignore next */
    const Client = restOpts.HttpClient || HttpClient;
    return new Client(serviceOpts, restOpts);
  }

  static createServiceAPI({ svc, restOptions, rootUrl, OpenAPIClient }) {
    const serviceConfig = Object.assign({}, svc);

    if (serviceConfig.url) {
      serviceConfig.url = `${rootUrl}${serviceConfig.url}`;
      const rest = this.createHttpClient(serviceConfig, restOptions);
      return restOptions.Promise.resolve({ [serviceConfig.id]: rest });
    }

    const cfg = Rest.generateOpenAPIConfig(serviceConfig, rootUrl);
    cfg.client = Rest.createHttpClient(serviceConfig, restOptions);

    return new OpenAPIClient(cfg);
  }

  /**
  * @param {RestOptions} opts The options for this instance of the enigma REST
  *                                  service.
  * @returns {Promise} Resolved when the REST instance and (potentially) service
  *                             API has been generated.
  */
  connect(opts) {
    const restOptions = JSON.parse(JSON.stringify(opts));
    Rest.validateRestOptions(restOptions);
    const services = restOptions.services;
    const rootUrl = Rest.generateRootUrl(restOptions);
    const servicePromises = [];
    servicePromises.push(restOptions.Promise.resolve({
      rest: Rest.createHttpClient({ url: rootUrl }, restOptions),
    }));

    if (services) {
      servicePromises.push(...services.map(
        /* istanbul ignore next */
        svc => Rest.createServiceAPI({ svc, restOptions, rootUrl, OpenAPIClient: OpenAPI })
      ));
    }

    return Promise.all(servicePromises).then((resolvedServices) => {
      const result = { rest: resolvedServices[0] };
      if (services) {
        services.forEach((svc, i) => {
          /* istanbul ignore next */
          result[svc.id] = resolvedServices[i + 1];
        });
      }
      return result;
    });
  }
}
