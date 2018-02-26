import { cfInfoSchemaKey } from '../helpers/entity-factory';
import { IRequestAction } from '../types/request.types';

// export const CF_INFO_ENTITY_KEY = 'cloudFoundryInfo';

export const GET_INFO = '[CF Endpoint] Get Info';

export class GetEndpointInfo implements IRequestAction {
  constructor(public cfGuid) { }
  type = GET_INFO;
  entityKey = cfInfoSchemaKey;
}
