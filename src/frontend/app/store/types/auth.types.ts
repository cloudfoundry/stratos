import { ScopeStrings } from '../../core/current-user-permissions.config';

export interface SessionDataEndpoint {
  guid: string;
  name: string;
  version: string;
  user: {
    admin: boolean,
    guid: string,
    name: string,
    scopes: ScopeStrings[];
  };
  type: string;
}
export interface SessionUser {
  admin: boolean;
  guid: string;
  name: string;
  scopes: ScopeStrings[];
}
export interface SessionEndpoints {
  [type: string]: SessionEndpoint;
}
export interface SessionEndpoint {
  [guid: string]: SessionDataEndpoint;
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
  ssoOptions?: string;
  sessionExpiresOn: number;
  domainMismatch?: boolean;
  diagnostics?: Diagnostics;
}
export interface Diagnostics {
  deploymentType?: string;
  gitClientVersion?: string;
  databaseMigrations?: any;
  helmName?: string;
  helmRevision?: string;
  helmChartVersion?: string;
  helmLastModified?: string;
}
