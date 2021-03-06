export interface SessionDataEndpoint {
  guid: string;
  name: string;
  version: string;
  user: SessionUser;
  type: string;
}
export interface SessionUser {
  admin: boolean;
  guid: string;
  name: string;
  scopes: string[];
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
export enum APIKeysEnabled {
  DISABLED = 'disabled',
  ADMIN_ONLY = 'admin_only',
  ALL_USERS = 'all_users'
}
export interface SessionDataConfig {
  enableTechPreview?: boolean;
  listMaxSize?: number;
  listAllowLoadMaxed?: boolean;
  APIKeysEnabled?: APIKeysEnabled;
  // Default value for Home View - show only favorited endpoints?
  homeViewShowFavoritesOnly?: boolean;
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
    [pluginName: string]: boolean,
  };
  config: SessionDataConfig;
}

export interface SessionDataEnvelope {
  status: string;
  error?: string;
  data?: SessionData;
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
