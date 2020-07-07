import { Action } from '@ngrx/store';

import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';


export class EntityDeleteCompleteAction implements Action {

  public static ACTION_TYPE = '[Entity] Entity delete complete';
  public type = EntityDeleteCompleteAction.ACTION_TYPE;
  public entityGuid: string;
  public entityType: string;
  public endpointType: string;
  public endpointGuid: string;
  public apiAction;

  // Try and parse an action to see if it contains all of the entity properties we expect
  public static parse(action: any): EntityDeleteCompleteAction {
    const apiAction = action.apiAction ? action.apiAction : action;
    if (apiAction.guid && apiAction.entityType && apiAction.endpointType && apiAction.endpointGuid) {
      const entityDeleteAction = new EntityDeleteCompleteAction();
      entityDeleteAction.entityGuid = apiAction.guid;
      entityDeleteAction.entityType = apiAction.entityType;
      entityDeleteAction.endpointGuid = apiAction.endpointGuid;
      entityDeleteAction.endpointType = apiAction.endpointType;
      return entityDeleteAction;
    }
    return null;
  }

  public asFavorite(): UserFavorite<IFavoriteMetadata> {
    return new UserFavorite<IFavoriteMetadata>(this.endpointGuid, this.endpointType, this.entityType, this.entityGuid);
  }
}
