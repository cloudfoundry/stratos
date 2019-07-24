import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { cfInfoEntityType } from '../cf-entity-factory';
import { EntityRequestAction } from '../../../store/src/types/request.types';

export const GET_CF_INFO = '[CF Endpoint] Get Info';

export class GetCFInfo implements EntityRequestAction {
  constructor(public cfGuid: string) { }
  type = GET_CF_INFO;
  endpointType = CF_ENDPOINT_TYPE;
  entityType = cfInfoEntityType;
}
