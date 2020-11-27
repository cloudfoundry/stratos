import { Action } from '@ngrx/store';

import { EntityRequestAction } from '../types/request.types';
import { IFavoriteMetadata, UserFavorite } from '../types/user-favorites.types';

export class EntityDeleteCompleteAction implements Action {

  public static ACTION_TYPE = '[Entity] Entity delete complete';
  public type = EntityDeleteCompleteAction.ACTION_TYPE;

  constructor(
    public entityGuid: string,
    public entityType: string,
    public endpointGuid: string,
    public endpointType: string,
    public action: EntityRequestAction,
  ) {}

  // Create an entity delete action if we have all of the properties we need
  public static parse(action: EntityRequestAction): EntityDeleteCompleteAction {
    if (action.guid && action.entityType && action.endpointType && action.endpointGuid) {
      return new EntityDeleteCompleteAction(action.guid, action.entityType, action.endpointGuid, action.endpointType, action);
    }
    return null;
  }

  public asFavorite(): UserFavorite<IFavoriteMetadata> {
    return new UserFavorite<IFavoriteMetadata>(this.endpointGuid, this.endpointType, this.entityType, this.entityGuid);
  }

}
