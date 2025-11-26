import type { Action } from '@ngrx/store';

import type { ApiRequestTypes } from '../../../store/src/reducers/api-request-reducer/request-helpers';
import type { PaginatedAction } from '../../../store/src/types/pagination.types';
import type { ICFAction, IStartRequestAction } from '../../../store/src/types/request.types';
import { StartAction } from '../../../store/src/types/request.types';
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
