import type { Store } from '@ngrx/store';

import { GET_ORGANIZATION, type GetOrganization } from '../actions/organization.actions';
import { ApiActionTypes, type APIResponse } from '../../../store/src/actions/request.actions';
import { GET_SPACE, type GetSpace } from '../actions/space.actions';
import type { GeneralEntityAppState, GeneralRequestDataState } from '../../../store/src/app-state';
import type { ICFAction, EntityRequestAction } from '../../../store/src/types/request.types';
import type { ValidateEntityResult } from './entity-relations.types';
import { orgSpacePostProcess } from './processors/org-space-post-processor';

export function validationPostProcessor(
  store: Store,
  action: EntityRequestAction,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    return apiAction(store, action, apiResponse, allEntities);
  }
}

function apiAction(
  store: Store,
  action: EntityRequestAction,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  const cfAction = action as ICFAction;
  const actions = cfAction.actions || [];
  switch (actions[0]) {
    case GET_ORGANIZATION:
      return orgSpacePostProcess(store, action as GetOrganization, apiResponse, allEntities);
    case GET_SPACE:
      return orgSpacePostProcess(store, action as GetSpace, apiResponse, allEntities);
  }
}
