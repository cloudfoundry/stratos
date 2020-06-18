import { STRATOS_ENDPOINT_TYPE, stratosEntityFactory, userFavouritesSchemaKey } from '../../helpers/stratos-entity-factory';
import { EntityRequestAction } from '../../types/request.types';

export class BaseUserFavoritesAction implements EntityRequestAction {
  constructor(
    actionType: string,
  ) {
    this.type = actionType;
  }
  public type: string;
  public url = '/user-favorites';

  public entity = [stratosEntityFactory(userFavouritesSchemaKey)]
  public entityType = userFavouritesSchemaKey;
  public endpointType = STRATOS_ENDPOINT_TYPE;
}
