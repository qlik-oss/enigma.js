declare module "enigma.js" {
  const enigma: EnigmaJS.Enigma;
  export default enigma;
}

declare namespace EnigmaJS {

  interface Enigma {
    /**
     * Create a session object.
     * @returns - Returns a session.
     * Note: See Configuration for the configuration options.
     */
    create(config: Configuration): Session;
  }

  interface Session {
    /**
     * Establishes the websocket against the configured URL. Eventually resolved with the QIX global interface when the connection has been established.
     * @return Promise.
     */
    open<T extends QixObject>(): Promise<T>;

    /**
     * Closes the websocket and cleans up internal caches, also triggers the closed event on all generated APIs.
     * Eventually resolved when the websocket has been closed.
     *
     * @param code Code number for closing event https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
     * @param reason Description of the reason for closing.
     * Note: you need to manually invoke this when you want to close a session and config.suspendOnClose is true.
     * @return Promise.
     */
    close(code?: number, reason?: string): Promise<any>;

    /**
     * Suspends the enigma.js session by closing the websocket and rejecting all method calls until it has been resumed again.
     * @return Promise.
     */
    suspend(): Promise<any>;

    /**
     * Resume a previously suspended enigma.js session by re-creating the websocket and, if possible, re-open the document
     * as well as refreshing the internal caches. If successful, changed events will be triggered on all generated APIs,
     * and on the ones it was unable to restore, the closed event will be triggered.
     * @param onlyIfAttached onlyIfAttached can be used to only allow resuming if the QIX Engine session was reattached properly.
     * @return Promise.
     * Note: Eventually resolved when the websocket (and potentially the previously opened document, and generated APIs) has been restored,
     * rejected when it fails any of those steps, or when onlyIfAttached is true and a new QIX Engine session was created.
     */
    resume(onlyIfAttached?: boolean): Promise<any>;

    /**
     * Handle opened state. This event is triggered whenever the websocket is connected and ready for communication.
     *
     * Handle closed state. This event is triggered when the underlying websocket is closed and config.suspendOnClose is false.
     *
     * Handle suspended state. This event is triggered in two cases (listed below). It is useful in scenarios where you for example
     * want to block interaction in your application until you are resumed again.
     * If config.suspendOnClose is true and there was a network disconnect (socked closed)
     * If you ran session.suspend()
     * The evt.initiator value is a string indicating what triggered the suspended state. Possible values: network, manual.
     *
     * Handle resumed state. This event is triggered when the session was properly resumed.
     * It is useful in scenarios where you for example can close blocking modal dialogs and allow the user to interact with your application again.
     *
     * notification:*
     * @param event - Event that triggers the function
     * @param func - Called function
     */
    on(
      event: "opened" | "closed" | "suspended" | "resumed" | string,
      func: any,
    ): void;
  }

  type MixinType =
    | "Doc"
    | "GenericObject"
    | "GenericDimension"
    | "GenericMeasure"
    | "GenericBookmark"
    | "GenericVariable"
    | "CurrentSelections"
    | "FieldList"
    | "Field"
    | "UndoInfo";

  interface Mixin {
    // Defines which Qix types this mixin should be applied to
    types?: MixinType[] | MixinType;
    // Mixin on a single type
    type?: MixinType;

    // Init method is run once for each mixin
    init(args: { config: any; api: QixObject }): void;

    // Extend mehods
    extend: Record<string, Function>;

    // Extend mehods
    overrides: Record<string, Function>;
  }

  /**
   * Engine Session Configuration
   */
  interface Configuration {
    /**
     * Object containing the specification for the API to generate. Corresponds to a specific version of the QIX Engine API.
     */
    schema: object;
    /**
     * String containing a proper websocket URL to QIX Engine.
     */
    url: string;
    /**
     * A function to use when instantiating the WebSocket, mandatory for Node.js.
     */
    createSocket?: (url: string) => WebSocket;
    /**
     * ES6-compatible Promise library.
     */
    Promise?: PromiseConstructor;
    /**
     * Set to true if the session should be suspended instead of closed when the websocket is closed.
     */
    suspendOnClose?: boolean;
    /**
     * Mixins to extend/augment the QIX Engine API.
     * Mixins are applied in the array order.
     */
    mixins?: Mixin[];
    /**
     * Interceptors for augmenting requests before they are sent to QIX Engine.
     * See Interceptors section for more information how each entry in this array should look like.
     * Interceptors are applied in the array order.
     */
    requestInterceptors?: RequestInterceptors[];
    /**
     * Interceptors for augmenting responses before they are sent to QIX Engine.
     * See Interceptors section for more information how each entry in this array should look like.
     * Interceptors are applied in the array order.
     */
    responseInterceptors?: ResponseInterceptors[];
    /**
     * An object containing additional JSON-RPC request parameters.
     * protocol.delta :  Set to false to disable the use of the bandwidth-reducing delta protocol.
     */
    protocol?: Protocol;
  }

  interface ResponseInterceptors {
    /**
     * This method is invoked when a previous interceptor has rejected the promise, use this to handle for example errors before they are sent into mixins.
     * @param session refers to the session executing the interceptor.
     * @param request is the JSON-RPC request resulting in this error. You may use .retry() to retry sending it to QIX Engine.
     * @param error is whatever the previous interceptor rejected with.
     */
    onRejected?(session: Session, request: any, error: any): Promise<any>;

    /**
     * This method is invoked when a promise has been successfully resolved, use this to modify the result or reject the promise chain before it is sent to mixins.
     * @param session refers to the session executing the interceptor.
     * @param request is the JSON-RPC request resulting in this error. You may use .retry() to retry sending it to QIX Engine.
     * @param error is whatever the previous interceptor resolved with.
     */
    onFulfilled?(session: Session, request: any, result: any): Promise<any>;
  }

  interface RequestInterceptors {
    /**
     * This method is invoked when a request is about to be sent to QIX Engine.
     * @param session refers to the session executing the interceptor.
     * @param request is the JSON-RPC request resulting in this error. You may use .retry() to retry sending it to QIX Engine.
     * @returns request the new request
     */
    onFulfilled?(session: Session, request: any, result: any): any;
  }

  interface Protocol {
    // Set to false to disable the use of the bandwidth-reducing delta protocol.
    delta?: boolean | undefined;
  }

  /**
   * Represents an Qix Engine object, e.g. a chart, listbox or the app
   */
  interface QixObject {
    session: Session;
    handle: number;
    id: string;
    type: string;
    genericType: string;
    /**
     * register a function for events
     * @param event - function called if this event occures
     * @param func - function that is called
     */
    on(event: "changed" | "closed", func: () => void): void;

    /**
     * manual emit an events
     * @param event - event that occures
     */
    emit(event: "changed" | "closed"): void;
  }
}
