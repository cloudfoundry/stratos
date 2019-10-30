import { RequestSectionKeys, TRequestTypeKeys } from '../reducers/api-request-reducer/types';
import { EndpointUser, EndpointModel } from './endpoint.types';
import { entityFactory, systemInfoSchemaKey } from '../helpers/entity-factory';
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

export const systemStoreNames: {
  section: TRequestTypeKeys,
  type: string
} = {
  section: RequestSectionKeys.Other,
  type: entityFactory(systemInfoSchemaKey).entityType
};
