/**
 * This object describes the configuration that is sent into `buildUrl(config)`.
 */
interface SenseConfiguration {
  appId?: string;
  noData?: boolean;
  secure?: boolean;
  host?: string;
  port?: number;
  prefix?: string;
  subpath?: string;
  route?: string;
  identity?: string;
  urlParams?: { [key: string]: any };
  ttl?: number;
}

declare class SenseUtilities {
  /**
   * Function used to build a URL.
   *
   * @param urlConfig - The URL configuration object.
   * @returns Returns the websocket URL.
   *
   * @example
   * import SenseUtilities from 'sense-utilities';
   *
   * const urlConfig: SenseConfiguration = {
   *   host: 'my-sense-host',
   *   appId: 'some-app',
   * };
   *
   * const url: string = SenseUtilities.buildUrl(urlConfig);
   */
  static buildUrl(urlConfig: SenseConfiguration): string;
}

export default SenseUtilities;
