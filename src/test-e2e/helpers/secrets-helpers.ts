import { browser } from "protractor";
import { E2EConfig, E2EConfigCloudFoundry, E2EEndpointConfig, E2EEndpointsConfig } from "../e2e.types";

const DEFAULT_CF_NAME = 'cf';

export class SecretsHelpers {

  secrets = browser.params as E2EConfig;

  constructor() {
    console.log(this.secrets);
  }

  getConsoleAdminUsername(): string {
    return this.secrets.consoleUsers.admin.username;
  }

  getConsoleAdminPassword(): string {
    return this.secrets.consoleUsers.admin.password;
  }

  getConsoleNonAdminUsername(): string {
    return this.secrets.consoleUsers.nonAdmin.username;
  }

  getConsoleNonAdminPassword(): string {
    return this.secrets.consoleUsers.nonAdmin.password;
  }

  getCloudFoundryEndpoints(): any {
  }

  getEndpoints(): E2EEndpointsConfig {
    return this.secrets.endpoints || {};
  }

  // Get the configration for the default CF Endpoint
  getDefaultCFEndpoint(): E2EConfigCloudFoundry {
    if (this.secrets.endpoints.cf) {
      return this.secrets.endpoints.cf.find((ep) => ep.name === DEFAULT_CF_NAME);
    }
    return null;
  }


}