import { RequestHelper, ConsoleUserType } from './request.helper';
import { SecretsHelper } from './secrets-helpers';

/**
 * Endpoint Configuration Interface
 */
export interface EndpointConfig {
  guid?: string;
  name: string;
  url: string;
  cnsi_type?: string;
  skipSSLValidation?: boolean;
}

/**
 * Endpoint Management Helper
 * Handles endpoint registration, connection, and removal
 * Migrated from Protractor ResetsHelpers and E2ESetup
 */
export class EndpointManagementHelper {
  private adminRequest: RequestHelper;
  private userRequest: RequestHelper;
  private secrets = SecretsHelper.load();
  private adminSessionCreated = false;
  private userSessionCreated = false;

  constructor(baseURL: string = 'https://127.0.0.1:4200') {
    this.adminRequest = new RequestHelper(baseURL);
    this.userRequest = new RequestHelper(baseURL);
  }

  /**
   * Ensure admin session exists
   */
  private async ensureAdminSession(): Promise<void> {
    if (!this.adminSessionCreated) {
      await this.adminRequest.init();
      await this.adminRequest.createSession(ConsoleUserType.admin);
      this.adminSessionCreated = true;
    }
  }

  /**
   * Ensure user session exists
   */
  private async ensureUserSession(): Promise<void> {
    if (!this.userSessionCreated) {
      await this.userRequest.init();
      await this.userRequest.createSession(ConsoleUserType.user);
      this.userSessionCreated = true;
    }
  }

  /**
   * Get request helper for user type
   */
  private async getRequest(userType: ConsoleUserType): Promise<RequestHelper> {
    if (userType === ConsoleUserType.admin) {
      await this.ensureAdminSession();
      return this.adminRequest;
    } else {
      await this.ensureUserSession();
      return this.userRequest;
    }
  }

  /**
   * Remove all registered endpoints
   */
  async clearAllEndpoints(): Promise<void> {
    await this.ensureAdminSession();

    const endpoints = await this.adminRequest.get('/api/v1/endpoints');

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    // Delete all endpoints
    for (const endpoint of endpoints) {
      await this.adminRequest.delete(`/api/v1/endpoints/${endpoint.guid}`);
    }
  }

  /**
   * Register the default Cloud Foundry endpoint
   */
  async registerDefaultCloudFoundry(): Promise<void> {
    await this.ensureAdminSession();

    const cfEndpoints = this.secrets.cloudfoundry;
    if (!cfEndpoints || cfEndpoints.length === 0) {
      throw new Error('No Cloud Foundry endpoints configured in secrets');
    }

    const defaultCF = cfEndpoints[0];

    await this.adminRequest.postForm('/api/v1/endpoints?endpoint_type=cf', {
      api_endpoint: defaultCF.url,
      cnsi_name: defaultCF.name,
      skip_ssl_validation: defaultCF.skipSSLValidation ? 'true' : 'false'
    });
  }

  /**
   * Register multiple Cloud Foundry endpoints
   */
  async registerMultipleCloudFoundries(): Promise<void> {
    await this.ensureAdminSession();

    const cfEndpoints = this.secrets.cloudfoundry;
    if (!cfEndpoints || cfEndpoints.length < 2) {
      throw new Error('At least 2 Cloud Foundry endpoints must be configured for this test');
    }

    for (const endpoint of cfEndpoints) {
      if (!endpoint.skip) {
        await this.adminRequest.postForm('/api/v1/endpoints?endpoint_type=cf', {
          api_endpoint: endpoint.url,
          cnsi_name: endpoint.name,
          skip_ssl_validation: endpoint.skipSSLValidation ? 'true' : 'false'
        });
      }
    }
  }

  /**
   * Connect all registered endpoints
   */
  async connectAllEndpoints(userType: ConsoleUserType = ConsoleUserType.admin): Promise<void> {
    const request = await this.getRequest(userType);

    const endpoints = await request.get('/api/v1/endpoints');

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    for (const endpoint of endpoints) {
      // Find credentials in secrets
      const endpointType = endpoint.cnsi_type;
      const secretEndpoints = this.secrets[endpointType] as any[];

      if (!secretEndpoints) {
        console.warn(`No credentials found for endpoint type: ${endpointType}`);
        continue;
      }

      const found = secretEndpoints.find((ep: any) =>
        endpoint.api_endpoint?.Host && ep.url.includes(endpoint.api_endpoint.Host)
      );

      if (found) {
        const creds = userType === ConsoleUserType.admin
          ? found.creds.admin
          : found.creds.nonAdmin || found.creds.admin;

        await request.postForm('/api/v1/tokens', {
          cnsi_guid: endpoint.guid,
          username: creds.username,
          password: creds.password
        });
      }
    }
  }

  /**
   * Connect a specific endpoint by name
   */
  async connectEndpoint(endpointName: string, userType: ConsoleUserType = ConsoleUserType.admin): Promise<void> {
    const request = await this.getRequest(userType);

    const endpoints = await request.get('/api/v1/endpoints');

    if (!endpoints || endpoints.length === 0) {
      throw new Error('No endpoints registered');
    }

    for (const endpoint of endpoints) {
      const endpointType = endpoint.cnsi_type;
      const secretEndpoints = this.secrets[endpointType] as any[];

      if (!secretEndpoints) {
        continue;
      }

      const found = secretEndpoints.find((ep: any) => ep.name === endpointName);

      if (found) {
        const creds = userType === ConsoleUserType.admin
          ? found.creds.admin
          : found.creds.nonAdmin || found.creds.admin;

        await request.postForm('/api/v1/tokens', {
          cnsi_guid: endpoint.guid,
          username: creds.username,
          password: creds.password
        });
        return;
      }
    }

    throw new Error(`Endpoint '${endpointName}' not found`);
  }

  /**
   * Get Stratos info from backend
   */
  async getInfo(userType: ConsoleUserType = ConsoleUserType.admin): Promise<any> {
    const request = await this.getRequest(userType);
    return await request.get('/pp/v1/info');
  }

  /**
   * Remove a specific endpoint by name
   */
  async removeEndpoint(endpointName: string): Promise<void> {
    await this.ensureAdminSession();

    const endpoints = await this.adminRequest.get('/api/v1/endpoints');

    if (!endpoints || endpoints.length === 0) {
      return;
    }

    for (const endpoint of endpoints) {
      if (endpoint.name === endpointName) {
        await this.adminRequest.delete(`/api/v1/endpoints/${endpoint.guid}`);
        return;
      }
    }
  }

  /**
   * Clean up request contexts
   */
  async dispose(): Promise<void> {
    await this.adminRequest.dispose();
    await this.userRequest.dispose();
    this.adminSessionCreated = false;
    this.userSessionCreated = false;
  }
}
