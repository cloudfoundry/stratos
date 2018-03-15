import { cfInfoSchemaKey } from '../helpers/entity-factory';
import { IRequestAction } from '../types/request.types';

export const GET_INFO = '[CF Endpoint] Get Info';

export class GetCFInfo implements IRequestAction {
  constructor(public cfGuid) { }
  type = GET_INFO;
  entityKey = cfInfoSchemaKey;
}
