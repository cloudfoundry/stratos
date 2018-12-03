import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';
import { first, tap } from 'rxjs/operators';
import { createGetApplicationAction } from '../features/applications/application.service';
import { RemoveUserFavoriteAction } from '../store/actions/user-favourites-actions/remove-user-favorite-action';
import { SaveUserFavoriteAction } from '../store/actions/user-favourites-actions/save-user-favorite-action';
import { AppState } from '../store/app-state';
import { applicationSchemaKey, entityFactory, organizationSchemaKey } from '../store/helpers/entity-factory';
import { isFavorite } from '../store/selectors/favorite.selectors';
import { EntityMonitor } from '../shared/monitors/entity-monitor';
import { GetOrganization } from '../store/actions/organization.actions';
import { UserFavorite } from '../store/types/user-favorites.types';
import { EntityService } from './entity-service';
import { getActionGeneratorFromFavoriteType } from './user-favorite-helpers';

export class UserFavoriteManager {
  constructor(private store: Store<AppState>) { }

  private getTypeAndID(favorite: UserFavorite) {
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

  public hydrateFavorite(favorite: UserFavorite) {
    const { type, id } = this.getTypeAndID(favorite);
    const action = getActionGeneratorFromFavoriteType(favorite);
    if (action) {
      const entityMonitor = new EntityMonitor(this.store, id, type, entityFactory(type));
      const entityService = new EntityService(
        this.store,
        entityMonitor,
        action
      );
      return entityService.entityObs$;
    }
    return observableOf(null);
  }

  public getIsFavoriteObservable(favorite: UserFavorite) {
    return this.store.select(
      isFavorite(favorite)
    );
  }

  public toggleFavorite(favorite: UserFavorite) {
    this.getIsFavoriteObservable(favorite).pipe(
      first(),
      tap(isFav => {
        if (isFav) {
          this.store.dispatch(new RemoveUserFavoriteAction(favorite.guid));
        } else {
          this.store.dispatch(new SaveUserFavoriteAction(favorite));
        }
      })
    ).subscribe();
  }


}
