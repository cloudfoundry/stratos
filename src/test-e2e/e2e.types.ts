export interface E2ECred {
  username: string;
  password: string;
}

export interface E2ECreds {
  admin: E2ECred;
  nonAdmin: E2ECred;
  removeUser: E2ECred;
}

export interface E2EEndpointConfig {
  name: string;
  url: string;
  skipSSLValidation: boolean;
  creds: E2ECreds;
  skip?: boolean;  // Should this endpoint be skipped when auto-registering
}

export interface ServiceConfig {
  invalidOrgName?: string;
  invalidSpaceName?: string;
  name: string;
}
export interface E2EServicesConfig {
  bindApp: string;
  publicService: ServiceConfig;
  privateService: ServiceConfig;
  spaceScopedService: ServiceConfig;
}

export interface E2EConfigCloudFoundry extends E2EEndpointConfig {
  testOrg: string;
  testSpace: string;
  testDeployApp: string;
  testDeployAppStack: string;
  services: E2EServicesConfig;
}

export interface E2EEndpointTypeConfig extends E2EEndpointConfig {
  type: string;
  typeLabel: string;
}

export interface E2EEndpointsConfig {
  cf: [
    E2EConfigCloudFoundry
  ];
}

export interface E2EConfig {
  consoleUsers: E2ECreds;
  endpoints: E2EEndpointsConfig;
  skipSSLValidation: boolean;
  headless: boolean;
  stratosGitHubApiUrl: string;
}
