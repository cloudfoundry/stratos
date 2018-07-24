import { Store } from '@ngrx/store';

import { GET_ORGANIZATION, GetAllOrgUsers } from '../../actions/organization.actions';
import { ApiActionTypes, APIResponse } from '../../actions/request.actions';
import { GET_SPACE } from '../../actions/space.actions';
import { AppState } from '../../app-state';
import { IRequestDataState } from '../../types/entity.types';
import { IRequestAction } from '../../types/request.types';
import { ValidateEntityResult } from './entity-relations.types';
import { orgSpacePostProcess } from './processors/org-space-post-processor';

export function validationPostProcessor(
  store: Store<AppState>,
  action: IRequestAction,
  apiResponse: APIResponse,
  allEntities: IRequestDataState): ValidateEntityResult {
  if (apiResponse) {
    console.log(action.type && action['actions'][0]);
  }
  if (action.type === ApiActionTypes.API_REQUEST_START) {
    switch (action['actions'][0]) {
      case GET_ORGANIZATION:
      case GET_SPACE:
        return orgSpacePostProcess(store, action, apiResponse, allEntities);
    }
  }
}
