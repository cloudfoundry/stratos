
export interface SessionDataEndpoint {
  guid: string;
  name: string;
  version: string;
  user: {
    admin: boolean,
    guid: string,
    name: string,
    scopes: string[];
  };
  type: string;
}
export interface SessionUser {
  admin: boolean;
  guid: string;
  name: string;
  scopes: string[];
}
export interface SessionEndpoints {
  [type: string]: {
    [guid: string]: SessionDataEndpoint
  };
}
export interface SessionData {
  endpoints?: SessionEndpoints;
  user?: SessionUser;
  version?: {
    proxy_version: string,
    database_version: number;
  };
  valid: boolean;
  uaaError?: boolean;
  upgradeInProgress?: boolean;
  sessionExpiresOn: number;
}
