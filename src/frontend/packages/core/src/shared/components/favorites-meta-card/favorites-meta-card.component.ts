import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { isObservable, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  RemoveUserFavoriteAction,
} from '../../../../../store/src/actions/user-favourites-actions/remove-user-favorite-action';
import { endpointEntitiesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { IFavoriteMetadata, UserFavorite } from '../../../../../store/src/types/user-favorites.types';
import { userFavoritesEntitySchema } from '../../../base-entity-schemas';
import { IFavoriteEntity } from '../../../core/user-favorite-manager';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../shared.types';
import { ConfirmationDialogConfig } from '../confirmation-dialog.config';
import { ConfirmationDialogService } from '../confirmation-dialog.service';
import { MetaCardMenuItem } from '../list/list-cards/meta-card/meta-card-base/meta-card.component';
import { IFavoritesMetaCardConfig } from './favorite-config-mapper';


@Component({
  selector: 'app-favorites-meta-card',
  templateUrl: './favorites-meta-card.component.html',
  styleUrls: ['./favorites-meta-card.component.scss']
})
export class FavoritesMetaCardComponent {
  @Input()
  public compact = false;

  @Input()
  public placeholder = false;

  @Input()
  public endpoint = false;

  @Input()
  public endpointHasEntities = false;

  @Input()
  public endpointDisconnected = false;

  public config: IFavoritesMetaCardConfig;

  public status$: Observable<StratosStatus>;

  public favorite: UserFavorite<IFavoriteMetadata>;

  /*
   We use this to pass the favorite to the metacard, this dictates if we should show the favorite star or not.
   We do not want to show the favorite star for endpoints that have favorite entities.
  */
  public metaFavorite: UserFavorite<IFavoriteMetadata>;

  public entityConfig: ComponentEntityMonitorConfig;

  public showMore: boolean;

  public prettyName: string;

  public confirmation: ConfirmationDialogConfig;

  public endpointConnected$: Observable<boolean>;
  public name$: Observable<string>;
  public routerLink$: Observable<string>;
  public actions$: Observable<MetaCardMenuItem[]>;

  @Input()
  set favoriteEntity(favoriteEntity: IFavoriteEntity) {
    if (!this.placeholder && favoriteEntity) {
      const endpoint$ = this.store.select(endpointEntitiesSelector).pipe(
        map(endpoints => endpoints[favoriteEntity.favorite.endpointId])
      );
      this.endpointConnected$ = endpoint$.pipe(map(endpoint => !!endpoint.user));
      this.actions$ = this.endpointConnected$.pipe(
        map(connected => connected ? this.config.menuItems : [])
      );
      const { cardMapper, favorite, prettyName } = favoriteEntity;
      this.favorite = favorite;
      this.metaFavorite = !this.endpoint || (this.endpoint && !this.endpointHasEntities) ? favorite : null;
      this.prettyName = prettyName || 'Unknown';
      this.entityConfig = new ComponentEntityMonitorConfig(favorite.guid, userFavoritesEntitySchema);

      this.setConfirmation(this.prettyName, favorite);

      const config = cardMapper && favorite && favorite.metadata ? cardMapper(favorite.metadata) : null;
      if (config) {
        if (this.endpoint) {
          this.name$ = endpoint$.pipe(map(endpoint => config.name + (endpoint.user ? '' : ' (Disconnected)')));
          this.routerLink$ = endpoint$.pipe(map(endpoint => endpoint.user ? config.routerLink : '/endpoints'));
        } else {
          this.name$ = observableOf(config.name);
          this.routerLink$ = endpoint$.pipe(map(endpoint => endpoint.user ? config.routerLink : null));
        }
        config.lines = this.mapLinesToObservables(config.lines);
        this.config = config;
      }
    }
  }

  constructor(private store: Store<CFAppState>, private confirmDialog: ConfirmationDialogService) { }

  public setConfirmation(prettyName: string, favorite: UserFavorite<IFavoriteMetadata>) {
    this.confirmation = new ConfirmationDialogConfig(
      `Unfavorite ${prettyName}`,
      `Are you sure you would like to unfavorite this ${prettyName.toLocaleLowerCase()} with the id ${favorite.entityId}?`,
      'Yes',
      true
    );
  }

  public confirmFavoriteRemoval() {
    this.confirmDialog.open(this.confirmation, this.removeFavorite);
  }

  private removeFavorite = () => {
    this.store.dispatch(new RemoveUserFavoriteAction(this.favorite));
  }

  public toggleMoreError() {
    this.showMore = !this.showMore;
  }

  private mapLinesToObservables(lines: [string, string | Observable<string>][]) {
    if (!lines) {
      return [];
    }
    return lines.map(line => {
      const [label, value] = line;
      if (!isObservable(value)) {
        return [
          label,
          observableOf(value)
        ] as [string, Observable<string>];
      }
      return line;
    });
  }

}
