import { Store } from '@ngrx/store';

import { GET_ORGANIZATION, GetOrganization } from '../../actions/organization.actions';
import { ApiActionTypes, APIResponse } from '../../actions/request.actions';
import { GET_SPACE, GetSpace } from '../../actions/space.actions';
import { AppState } from '../../app-state';
import { IRequestDataState } from '../../types/entity.types';
import { ICFAction, IRequestAction } from '../../types/request.types';
import { ValidateEntityResult } from './entity-relations.types';
import { orgSpacePostProcess } from './processors/org-space-post-processor';

export function validationPostProcessor(
  store: Store<AppState>,
  action: IRequestAction,
  apiResponse: APIResponse,
  allEntities: IRequestDataState): ValidateEntityResult {
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    return apiAction(store, action, apiResponse, allEntities);
  }
}

function apiAction(
  store: Store<AppState>,
  action: IRequestAction,
  apiResponse: APIResponse,
  allEntities: IRequestDataState): ValidateEntityResult {
  const cfAction = action as ICFAction;
  const actions = cfAction.actions || [];
  switch (actions[0]) {
    case GET_ORGANIZATION:
      return orgSpacePostProcess(store, action as GetOrganization, apiResponse, allEntities);
    case GET_SPACE:
      return orgSpacePostProcess(store, action as GetSpace, apiResponse, allEntities);
  }
}
