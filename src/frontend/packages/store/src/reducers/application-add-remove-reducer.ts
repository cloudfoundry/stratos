import { CREATE_SUCCESS, DELETE_SUCCESS } from '../../../cloud-foundry/src/actions/application.actions';
import { applicationEntityType } from '../../../cloud-foundry/src/cf-entity-factory';
import { getCFEntityKey } from '../../../cloud-foundry/src/cf-entity-helpers';
import { IApp, ISpace } from '../../../core/src/core/cf-api.types';
import { deepMergeState } from '../helpers/reducer.helper';
import { APIResource } from '../types/api.types';
import { APISuccessOrFailedAction } from '../types/request.types';


export function applicationAddRemoveReducer() {
  return (state: APIResource, action: APISuccessOrFailedAction) => {
    switch (action.type) {
      case CREATE_SUCCESS:
        return addApplicationToSpace(state, action);
      case DELETE_SUCCESS:
        return deleteApplicationFromSpace(state, action);
    }
    return state;
  };
}

function addApplicationToSpace(state: APIResource, action: APISuccessOrFailedAction) {
  const cfApplicationEntityKey = getCFEntityKey(applicationEntityType);
  if (action.response && action.response.entities && action.response.entities[cfApplicationEntityKey]) {
    const apps = action.response.entities[cfApplicationEntityKey];
    const updatedSpaces = {};
    Object.keys(apps).forEach(appGuid => {
      const app = apps[appGuid] as APIResource<IApp>;
      const spaceGuid = app.entity.space_guid;
      const space = state[spaceGuid] as APIResource<ISpace>;
      if (space.entity.apps) {
        const newSpaceEntity = {
          entity: {
            apps: [...space.entity.apps, app.metadata.guid]
          }
        };
        updatedSpaces[spaceGuid] = newSpaceEntity;
      }
    });
    if (Object.keys(updatedSpaces).length) {
      return deepMergeState(state, updatedSpaces);
    }
  }

  return state;
}

interface SpaceAsAppRefs {
  apps: string[];
}

function deleteApplicationFromSpace(state: APIResource, action: APISuccessOrFailedAction) {
  // GUID of the application that was deleted
  const appGuid = action.apiAction.guid;
  // We don't know ths space GUID, but app guids are unique, so look across all spaces
  const updatedSpaces = {};
  Object.keys(state).forEach(spaceGuid => {
    const space = state[spaceGuid] as APIResource<SpaceAsAppRefs>;
    const apps = space.entity.apps as string[];
    if (apps && apps.findIndex((value) => value === appGuid) >= 0) {
      const newSpaceEntity = {
        entity: {
          apps: apps.filter((guid) => guid !== appGuid)
        }
      };
      updatedSpaces[spaceGuid] = newSpaceEntity;
    }
  });
  if (Object.keys(updatedSpaces).length) {
    return deepMergeState(state, updatedSpaces);
  }

  return state;
}
