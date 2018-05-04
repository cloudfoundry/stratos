
export interface SessionDataEndpoint {
  guid: string;
  name: string;
  version: string;
  user: {
    admin: boolean,
    guid: string,
    name: string
  };
  type: string;
}

export interface SessionData {
  endpoints?: {
    [type: string]: {
      [guid: string]: SessionDataEndpoint
    }
  };
  user?: {
    admin: boolean,
    guid: string,
    name: string
  };
  version?: {
    proxy_version: string,
    database_version: number;
  };
  valid: boolean;
  uaaError?: boolean;
  upgradeInProgress?: boolean;
  sessionExpiresOn: number;
}
