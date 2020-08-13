import { EndpointModel, EndpointUser } from './endpoint.types';

export interface SystemInfo {
  version: {
    proxy_version: string,
    database_version: number
  };
  user: EndpointUser;
  endpoints: {
    [type: string]: {
      [key: string]: EndpointModel
    }
  };
}
