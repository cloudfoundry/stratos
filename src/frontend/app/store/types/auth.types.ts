export interface SessionData {
  endpoints?: {
    [type: string]: {
      [guid: string]: {
        guid: string;
        name: string;
        version: string;
        user: {
          admin: boolean,
          guid: string,
          name: string
        },
        type: string;
      }
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
  sessionExpiresOn: number;
}
