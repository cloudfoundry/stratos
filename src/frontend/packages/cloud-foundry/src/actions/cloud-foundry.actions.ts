import { EntityRequestAction } from '../../../store/src/types/request.types';
import { cfInfoEntityType } from '../cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../cf-types';

export const GET_CF_INFO = '[CF Endpoint] Get Info';

export class GetCFInfo implements EntityRequestAction {
  constructor(public guid: string) { }
  type = GET_CF_INFO;
  endpointType = CF_ENDPOINT_TYPE;
  entityType = cfInfoEntityType;
}
