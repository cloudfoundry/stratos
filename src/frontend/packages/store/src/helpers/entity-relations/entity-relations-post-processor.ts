import { Store } from '@ngrx/store';

import { GET_ORGANIZATION, GetOrganization } from '../../../../cloud-foundry/src/actions/organization.actions';
import { ApiActionTypes, APIResponse } from '../../actions/request.actions';
import { GET_SPACE, GetSpace } from '../../../../cloud-foundry/src/actions/space.actions';
import { GeneralEntityAppState, GeneralRequestDataState } from '../../app-state';
import { ICFAction, EntityRequestAction } from '../../types/request.types';
import { ValidateEntityResult } from './entity-relations.types';
import { orgSpacePostProcess } from './processors/org-space-post-processor';

export function validationPostProcessor(
  store: Store<GeneralEntityAppState>,
  action: EntityRequestAction,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    return apiAction(store, action, apiResponse, allEntities);
  }
}

function apiAction(
  store: Store<GeneralEntityAppState>,
  action: EntityRequestAction,
  apiResponse: APIResponse,
  allEntities: GeneralRequestDataState): ValidateEntityResult {
  const cfAction = action as ICFAction;
  const actions = cfAction.actions || [];
  // TODO This need to be moved
  // What is this used for and how can it be put into the entity catalogue?
  switch (actions[0]) {
    case GET_ORGANIZATION:
      return orgSpacePostProcess(store, action as GetOrganization, apiResponse, allEntities);
    case GET_SPACE:
      return orgSpacePostProcess(store, action as GetSpace, apiResponse, allEntities);
  }
}
