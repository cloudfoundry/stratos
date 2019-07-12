import { EntityRequestAction, WrapperRequestActionSuccess } from '../../src/types/request.types';
import { EndEntityRequestPipe } from '../entity-request-pipeline.types';
import { Store } from '@ngrx/store';
import { ApiRequestTypes } from '../../src/reducers/api-request-reducer/request-helpers';
import { NormalizedResponse } from '../../src/types/api.types';

// const startEntityPipe = (state, action) => state;

export const endEntityPipe: EndEntityRequestPipe<any> = (
  store: Store<any>,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  data: NormalizedResponse
) => {
  store.dispatch(new WrapperRequestActionSuccess(data, action, requestType));
};

