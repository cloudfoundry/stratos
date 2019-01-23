import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isObservable, Observable, of as observableOf } from 'rxjs';

import { IFavoriteEntity } from '../../../core/user-favorite-manager';
import { RemoveUserFavoriteAction } from '../../../store/actions/user-favourites-actions/remove-user-favorite-action';
import { AppState } from '../../../store/app-state';
import { entityFactory, userFavoritesSchemaKey } from '../../../store/helpers/entity-factory';
import { UserFavorite, IFavoriteMetadata } from '../../../store/types/user-favorites.types';
import { CardStatus, ComponentEntityMonitorConfig } from '../../shared.types';
import { ConfirmationDialogConfig } from '../confirmation-dialog.config';
import { ConfirmationDialogService } from '../confirmation-dialog.service';
import { IFavoritesMetaCardConfig } from './favorite-config-mapper';
import { EndpointModel } from '../../../store/types/endpoint.types';
import { endpointEntitiesSelector } from '../../../store/selectors/endpoint.selectors';
import { map } from 'rxjs/operators';

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

  public status$: Observable<CardStatus>;

  public favorite: UserFavorite<IFavoriteMetadata>;

  public entityConfig: ComponentEntityMonitorConfig;

  public showMore: boolean;

  public prettyName: string;

  public confirmation: ConfirmationDialogConfig;

  public endpointConnected$: Observable<boolean>;
  public name$: Observable<string>;
  public routerLink$: Observable<string>;

  @Input()
  set favoriteEntity(favoriteEntity: IFavoriteEntity) {
    if (!this.placeholder && favoriteEntity) {
      const endpoint$ = this.store.select(endpointEntitiesSelector).pipe(
        map(endpoints => endpoints[favoriteEntity.favorite.endpointId])
      );
      this.endpointConnected$ = endpoint$.pipe(map(endpoint => !!endpoint.user));
      const { cardMapper, favorite, prettyName } = favoriteEntity;
      this.favorite = favorite;
      this.prettyName = prettyName;
      this.entityConfig = new ComponentEntityMonitorConfig(favorite.guid, entityFactory(userFavoritesSchemaKey));

      this.setConfirmation(prettyName, favorite);

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

  constructor(private store: Store<AppState>, private confirmDialog: ConfirmationDialogService) { }

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
    this.store.dispatch(new RemoveUserFavoriteAction(this.favorite.guid));
  }

  public toggleMoreError() {
    this.showMore = !this.showMore;
  }

  private mapLinesToObservables(lines: [string, string | Observable<string>][]) {
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
