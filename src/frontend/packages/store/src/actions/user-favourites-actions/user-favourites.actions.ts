import { EntityRequestAction } from '../../types/request.types';

export class BaseUserFavoritesAction implements EntityRequestAction {
  constructor(
    actionType: string,
  ) {
    this.type = actionType;
  }
  public type: string;
  public url = '/user-favorites';

  public entityType: userFavoritesEntitySchema.entityType,
  public endpointType: userFavoritesEntitySchema.endpointType,
}
