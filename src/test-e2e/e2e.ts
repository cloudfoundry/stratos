import { browser, promise, protractor } from 'protractor';

import { CustomizationsMetadata } from '../frontend/packages/core/src/core/customizations.types';
import { ConsoleUserType, E2EHelpers } from './helpers/e2e-helpers';
import { RequestHelpers } from './helpers/request-helpers';
import { ResetsHelpers } from './helpers/reset-helpers';
import { SecretsHelpers } from './helpers/secrets-helpers';
import { ssoHelper } from './helpers/sso-helper';


/**
 * E2E Helper - just use this via the 'e2e' const - don't import the helpers directly
 */
export class E2E {

  // Turn on debug logging for test helpers
  public static DEBUG_LOGGING = !!process.env.STRATOS_E2E_DEBUG || false;

  /**
   * Temporary location for customization, we should in future look to fetch this a better way from client side code
  */
  public static customization: CustomizationsMetadata = {
    alwaysShowNavForEndpointTypes: (epType) => true
  }

  // General helpers
  public helper = new E2EHelpers();

  // Stratos Info from the backend
  public info: any = {};

  // Access to the secrets configuration
  public secrets = new SecretsHelpers();

  static debugLog(log, ...optionalParams: any[]) {
    if (E2E.DEBUG_LOGGING) {
      /* tslint:disable:no-console*/
      if (optionalParams && optionalParams.length) {
        console.log(log, optionalParams);
      } else {
        console.log(log);
      }
      /* tslint:disable */
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
  sleep(duration: number): promise.Promise<any> {
    return browser.driver.sleep(duration);
  }

  /**
   * Log message in the control flow
   */
  log(log: string, ...optionalParams: any[]) {
    /* tslint:disable:no-console*/
    if (optionalParams && optionalParams.length) {
      protractor.promise.controlFlow().execute(() => console.log(log, optionalParams));
    } else {
      protractor.promise.controlFlow().execute(() => console.log(log));
    }
    /* tslint:disable */
  }


  /**
   * Log message in the control flow if debug logging is set
   */
  debugLog(log: string, ...optionalParams: any[]) {
    protractor.promise.controlFlow().execute(() => E2E.debugLog(log, optionalParams));
  }
}

/**
 * Helper to set up Stratos with the desired register/connected endpoints
 */
export class E2ESetup {
  public adminReq: any;
  public userReq: any;
  private setupOps: any[] = [];
  private reqHelper = new RequestHelpers();
  private resetsHelper = new ResetsHelpers();

  private needAdminSession = false;
  private needUserSession = false;

  static setup(userType: ConsoleUserType) {
    return new E2ESetup(userType);
  }

  constructor(public loginUserType: ConsoleUserType) {
    // Create requests in case we need to make any API requests as admin and/or user
    this.adminReq = this.reqHelper.newRequest();
    this.userReq = this.reqHelper.newRequest();

    // Get the SSO login Status if needed
    if (!ssoHelper.ssoEnabledFetched) {
      this.getSSOLoginStatus();
    }

    // The setup sequence won't be executed until the appropriate stage in the control flow
    protractor.promise.controlFlow().execute(() => this.doSetup());
    // Adds the setup flow to the browser chain - this will run after all of the setup ops
    const that = this;
    protractor.promise.controlFlow().execute(() => {
      E2E.debugLog('Logging in as user: ' + (that.loginUserType === ConsoleUserType.admin ? 'admin' : 'user'));
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
    return this;
  }

  // Ensure that an admin session is created, even if it is not needed by the setup process
  requireAdminSession() {
    this.needAdminSession = true;
  }

  private getSSOLoginStatus() {
    return this.addSetupOp(this.resetsHelper.getSSOLoginStatus.bind(this.resetsHelper, null, ssoHelper),
      'Check SSO Login Status');
  }

  /**
   * Reset the backend so that there are no registered endpoints§
   */
  clearAllEndpoints() {
    this.needAdminSession = true;
    return this.addSetupOp(this.resetsHelper.removeAllEndpoints.bind(this.resetsHelper, this.adminReq),
      'Remove all endpoints');
  }

  /**
   * Register the default Cloud Foundry (named 'cf')
   */
  registerDefaultCloudFoundry() {
    this.needAdminSession = true;
    return this.addSetupOp(this.resetsHelper.registerDefaultCloudFoundry.bind(this.resetsHelper, this.adminReq),
      'Register default CF');
  }

  /**
   * Register multiple Cloud Foundries - ensures at least 2 are available
   */
  registerMultipleCloudFoundries() {
    this.needAdminSession = true;
    return this.addSetupOp(this.resetsHelper.registerMultipleCloudFoundries.bind(this.resetsHelper, this.adminReq),
      'Register multiple CFs');
  }

  /**
   * Connect all registered endpoints
   */
  connectAllEndpoints(userType: ConsoleUserType = ConsoleUserType.admin) {
    return this.addSetupOp(this.resetsHelper.connectAllEndpoints.bind(this.resetsHelper, this.getReq(userType), userType),
      'Connect all endpoints');
  }

  /**
   * Connect the named endpoint
   */
  connectEndpoint(endpointName: string, userType: ConsoleUserType = ConsoleUserType.admin) {
    return this.addSetupOp(this.resetsHelper.connectEndpoint.bind(this.resetsHelper, this.getReq(userType), endpointName, userType),
      'Connect endpoint: ' + endpointName);
  }

  /**
   * Retrieve info from backend
   */
  getInfo(userType: ConsoleUserType = ConsoleUserType.admin) {
    return this.addSetupOp(this.resetsHelper.getInfo.bind(this.resetsHelper, this.getReq(userType), e2e),
      'Get Info');
  }


  // NOTE: You don't need to explicitly call createSession
  // Create a new session with Stratos so that we can make API requests
  private createSession = (req, userType) => {
    return protractor.promise.controlFlow().execute(() => {
      E2E.debugLog('Create session as user: ' + (userType === ConsoleUserType.admin ? 'admin' : 'user'));
      return this.reqHelper.createSession(req, userType);
    });
  }

  private getReq(userType: ConsoleUserType) {
    if (userType === ConsoleUserType.admin) {
      this.needAdminSession = true;
    } else {
      this.needUserSession = true;
    }
    return userType === ConsoleUserType.admin ? this.adminReq : this.userReq;
  }

  private doSetup() {
    const p = promise.fulfilled(true);

    // Extend the timeout for setup
    const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

    // Create the sessions neeed
    if (this.needAdminSession) {
      p.then(() => this.createSession(this.adminReq, ConsoleUserType.admin));
    }

    if (this.needUserSession) {
      p.then(() => this.createSession(this.userReq, ConsoleUserType.user));
    }

    this.setupOps.forEach(op => {
      p.then(() => protractor.promise.controlFlow().execute(() => op.bind(this)()));
    });

    // Reset timeout
    p.then(() => protractor.promise.controlFlow().execute(() => jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout));

    return promise;
  }

  private addSetupOp(fn: Function, desc?: string) {
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
