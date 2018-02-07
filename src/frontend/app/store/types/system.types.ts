import { RequestSectionKeys, TRequestTypeKeys } from '../reducers/api-request-reducer/types';
import { CNSISModel, EndpointUser } from './cnsis.types';
export interface SystemInfo {
  version: {
    proxy_version: string,
    database_version: number
  };
  user: EndpointUser;
  endpoints: {
    cf: {
      [key: string]: CNSISModel
    }
  };
}

export const systemStoreNames: {
  section: TRequestTypeKeys,
  type: string
} = {
    section: RequestSectionKeys.Other,
    type: 'system'
  };
