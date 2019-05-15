import { cfInfoSchemaKey } from '../helpers/entity-factory';
import { IRequestAction } from '../types/request.types';
import { CF_ENDPOINT_TYPE } from '../../../cloud-foundry/cf-types';

export const GET_INFO = '[CF Endpoint] Get Info';

export class GetCFInfo implements IRequestAction {
  constructor(public cfGuid: string) { }
  type = GET_INFO;
  endpointType = CF_ENDPOINT_TYPE;
  entityType = cfInfoSchemaKey;
}
