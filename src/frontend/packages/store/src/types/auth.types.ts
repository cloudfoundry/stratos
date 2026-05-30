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
export enum UserEndpointsEnabled {
  /**
   * No users can see or create their own endpoints. Admins cannot see any previously created user endpoints.
   */
  DISABLED = 'disabled',
  /**
   * No users can see or create their own endpoints. Admins can manage previously created user endpoints
   */
  ADMIN_ONLY = 'admin_only',
  /**
   * Endpoint Admins can see and create their own endpoints. Admins can manage all user endpoints
   */
  ENABLED = 'enabled'
}
export interface SessionDataConfig {
  enableTechPreview?: boolean;
  listMaxSize?: number;
  listAllowLoadMaxed?: boolean;
  APIKeysEnabled?: APIKeysEnabled;
  // Default value for Home View - show only favorited endpoints?
  homeViewShowFavoritesOnly?: boolean;
  userEndpointsEnabled?: UserEndpointsEnabled;
}
export interface SessionData {
  endpoints?: SessionEndpoints;
  user?: SessionUser;
  version?: {
    proxy_version: string;
    database_version: number;
    build_date?: string;
    git_commit?: string;
    git_branch?: string;
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

/**
 * A redirect to replay after login. Previously lived in auth.actions.ts
 * (alongside `RouterNav`). Now a plain type owned by the auth domain and
 * set via {@link AuthDataService.navigateAndRememberRedirect}.
 */
export interface RouterRedirect {
  path: string;
  queryParams?: {
    [key: string]: string
  };
}

export interface AuthUser {
  guid: string;
  name: string;
  admin: boolean;
}

/**
 * Shape of the auth state. Previously the `auth` ngrx slice (auth.reducer.ts);
 * now owned and mutated by {@link AuthDataService} as a signal.
 */
export interface AuthState {
  loggedIn: boolean;
  loggingIn: boolean;
  user: AuthUser;
  error: boolean;
  errorResponse: any;
  sessionData: SessionData;
  verifying: boolean;
  redirect?: RouterRedirect;
  keepAlive?: boolean;
}

export interface TokenData {
  token_guid: string;
  auth_token: string;
  refresh_token: string;
  token_expiry: number;
  disconnected: boolean;
  auth_type: string;
  metadata: string;
  system_shared: boolean;
  linked_guid: string;
  certificate: string;
  certificate_key: string;
  enabled: boolean;
}

export interface AuthTokenEnvelope {
  status: string;
  error?: string;
  data?: TokenData;
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
