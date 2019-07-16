import { EntityRequestAction, WrapperRequestActionSuccess } from '../../types/request.types';
import { EndEntityRequestPipe } from '../entity-request-pipeline.types';
import { Action } from '@ngrx/store';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../../types/api.types';

// const startEntityPipe = (state, action) => state;

export const endEntityHandler: EndEntityRequestPipe<any> = (
  actionDispatcher: (action: Action) => void,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  data: NormalizedResponse
) => {
  actionDispatcher(new WrapperRequestActionSuccess(data, action, requestType));
};

