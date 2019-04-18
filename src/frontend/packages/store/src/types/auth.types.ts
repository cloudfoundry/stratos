import { ScopeStrings } from '../../../core/src/core/current-user-permissions.config';

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
export interface PluginConfig {
  userInvitationsEnabled: 'true' | 'false';
  disablePersistenceFeatures: 'true' | 'false';
  [key: string]: 'true' | 'false';
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
  ['plugin-config']?: PluginConfig;
  plugins: {
    demo: boolean,
    [pluginName: string]: boolean
  };
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
