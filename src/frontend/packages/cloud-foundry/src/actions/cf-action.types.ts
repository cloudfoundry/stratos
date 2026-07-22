import { Action } from '../../../store/src/types/action.types';

import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { ApiRequestTypes, ICFAction, IStartRequestAction, StartAction } from '../../../store/src/types/request.types';
import { CF_ENDPOINT_TYPE } from '../cf-types';

export abstract class CFStartAction extends StartAction implements Action {
  public endpointType = CF_ENDPOINT_TYPE;
}

export class StartCFAction extends CFStartAction implements IStartRequestAction {
  constructor(
    public apiAction: ICFAction | PaginatedAction,
    public requestType: ApiRequestTypes = 'fetch'
  ) {
    super();
  }
}
