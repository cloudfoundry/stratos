import { browser, promise, protractor } from 'protractor';
import { ConsoleUserType, E2EHelpers } from './helpers/e2e-helpers';
import { RequestHelpers } from './helpers/request-helpers';
import { ResetsHelpers } from './helpers/reset-helpers';
import { SecretsHelpers } from './helpers/secrets-helpers';

/**
 * E2E Helper - just use this via the 'e2e' const - don't import the helpers directly
 */
export class E2E {

  // Turn on debug logging for test helpers
  public static DEBUG_LOGGING = false;

  // General helpers
  public helper = new E2EHelpers();

  // Access to the secrets configuration
  public secrets = new SecretsHelpers();

  static debugLog(log) {
    if (E2E.DEBUG_LOGGING) {
      console.log(log);
    }
  }

  /**
   * Initialize and return helper to setup Stratos for a test spec
   */
  setup(userType: ConsoleUserType) {
    return E2ESetup.setup(userType);
  }

  /**
   * Convenience for sleep
   */
  sleep(duration) {
    browser.driver.sleep(duration);
  }

  /**
   * Log message in the control flow
   */
  log(log) {
    protractor.promise.controlFlow().execute(() => console.log(log));
  }
}

/**
 * Helper to set up Stratos with the desired register/connected endpoints
 */
export class E2ESetup {
  public req: any;
  private setupOps: any[] = [];
  private userType: ConsoleUserType;
  private loginUserType: ConsoleUserType;
  private reqHelper = new RequestHelpers();
  private resetsHelper = new ResetsHelpers();

  static setup(userType: ConsoleUserType) {
    return new E2ESetup(userType);
  }

  constructor(userType: ConsoleUserType) {
    this.userType = userType;
    this.loginUserType = userType;
    // Create a request in case we need to make any API requests
    this.req = this.reqHelper.newRequest();
    // The setup sequence won't be executed until the appropriate stage in the control flow
    protractor.promise.controlFlow().execute(() => this.doSetup());
    // Adds the setup flow to the browser chain - this will run after all of the setup ops
    const that = this;
    protractor.promise.controlFlow().execute(() => {
      return e2e.helper.setupApp(that.loginUserType);
    });
  }

  // Login as the specified user, rather than the user type used to setup the backend
  loginAs(userType: ConsoleUserType) {
    this.loginUserType = userType;
    return this;
  }

  // Don't login after setup is done
  doNotLogin() {
    this.loginUserType = null;
  }

  /**
   * Reset the backend so that there are no registered endpoints§
   */
  clearAllEndpoints() {
    return this.addSetupOp(this.resetsHelper.removeAllEndpoints.bind(this.resetsHelper, this.req),
      'Remove all endpoints');
  }

  /**
   * Register the default Cloud Foundry (named 'cf')
   */
  registerDefaultCloudFoundry() {
    return this.addSetupOp(this.resetsHelper.registerDefaultCloudFoundry.bind(this.resetsHelper, this.req),
      'Register default CF');
  }

  /**
   * Register multiple Cloud Foundries - ensures at least 2 are available
   */
  registerMultipleCloudFoundries() {
    return this.addSetupOp(this.resetsHelper.registerMultipleCloudFoundries.bind(this.resetsHelper, this.req),
      'Register multiple CFs');
  }

  /**
   * Connect all registered endpoints
   */
  connectAllEndpoints(userType: ConsoleUserType = ConsoleUserType.admin) {
    return this.addSetupOp(this.resetsHelper.connectAllEndpoints.bind(this.resetsHelper, this.req, userType),
      'Connect all endpoints');
  }

  /**
   * Connect the named endpoint
   */
  connectEndpoint(endpointName: string, userType: ConsoleUserType = ConsoleUserType.admin) {
    return this.addSetupOp(this.resetsHelper.connectEndpoint.bind(this.resetsHelper, this.req, endpointName, userType),
      'Connect endpoint: ' + endpointName);
  }

  // NOTE: You don't need to explictly call createSession
  // Create a new session with Stratos so that we can make API requests
  private createSession = () => {
    return protractor.promise.controlFlow().execute(() => {
      E2E.debugLog('Create session as user: ' + this.userType);
      return this.reqHelper.createSession(this.req, this.userType);
    });
  }

  private doSetup() {
    const p = promise.fulfilled(true);

    // If we have any setup ops, then we need to create a session first
    if (this.setupOps.length > 0) {
      p.then(() => this.createSession());
    }

    this.setupOps.forEach(op => {
      p.then(() => protractor.promise.controlFlow().execute(() => op.bind(this)()));
    });

    return promise;
  }

  private addSetupOp(fn: Function, desc?: string) {
    const that = this;
    this.setupOps.push(() => protractor.promise.controlFlow().execute(() => {
      E2E.debugLog(desc || 'Performing setup op');
      return fn();
    }));
    return this;
  }

}

/**
 *
 *  Main helper for E2E Tests
 *
 */

// This is the 'e2e' global that you should import into your spec files
export const e2e = new E2E();


