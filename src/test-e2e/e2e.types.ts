export interface E2ECreds {
  admin: {
    username: string;
    password: string;
  },
  nonAdmin?: {
    username: string;
    password: string;
  }
}

export interface E2EEndpointConfig {
  name: string;
  url: string;
  skip_ssl_validation: boolean;
  creds: E2ECreds;
}

export interface E2EConfigCloudFoundry extends E2EEndpointConfig {
  testOrg: string;
  testSpace: string;
}
export interface E2EEndpointsConfig {
  cf?: [
    E2EConfigCloudFoundry
  ]
}

export interface E2EConfig {
  consoleUsers: E2ECreds;
  endpoints: E2EEndpointsConfig;
}
