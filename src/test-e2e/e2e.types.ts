export interface E2ECred {
  username: string;
  password: string;
}

export interface E2ECreds {
  admin: E2ECred;
  nonAdmin: E2ECred;
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

export interface E2ECfInviteConfig {
  clientId: string;
  clientSecret: string;
}

export interface E2EConfigCloudFoundry extends E2EEndpointConfig {
  testOrg: string;
  testSpace: string;
  testDeployApp: string;
  testDeployAppStack: string;
  services: E2EServicesConfig;
  invite: E2ECfInviteConfig;
  uaa: E2EUaa;
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

export interface E2EUaaCreds {
  clientId: string;
  clientSecret: string;
  grantType?: string;
}

export interface E2EUaa {
  creds: E2EUaaCreds;
  tokenEndpoint: string;
  zone: string;
}

export interface E2EConfig {
  consoleUsers: E2ECreds;
  endpoints: E2EEndpointsConfig;
  skipSSLValidation: boolean;
  headless: boolean;
  stratosGitHubApiUrl: string;
}
