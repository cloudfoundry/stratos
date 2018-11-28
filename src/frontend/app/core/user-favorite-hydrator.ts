import { EntityMonitor } from './../shared/monitors/entity-monitor';
import { IUserFavorite } from './../store/types/user-favorites.types';
import { AppState } from '../store/app-state';
import { Store } from '@ngrx/store';
import { entityFactory } from '../store/helpers/entity-factory';
import { EntityService } from './entity-service';
import { IRequestAction } from '../store/types/request.types';
export class UserFavoriteHydrator {
  constructor(private store: Store<AppState>) { }

  private getTypeAndID(favorite: IUserFavorite) {
    if (favorite.entityId) {
      return {
        type: favorite.entityType,
        id: favorite.entityId
      };
    }
    return {
      type: favorite.endpointType,
      id: favorite.endpointId
    };
  }

  public hydrate(favorite: IUserFavorite, action: IRequestAction) {
    const { type, id } = this.getTypeAndID(favorite);
    const entityMonitor = new EntityMonitor(this.store, id, type, entityFactory(type));
    const entityService = new EntityService(
      this.store,
      entityMonitor,
      action
    );
    return entityService.entityObs$;
  }
}
