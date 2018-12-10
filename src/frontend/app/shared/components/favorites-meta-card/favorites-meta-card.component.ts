import { Component, Input, OnInit } from '@angular/core';
import { IFavoriteEntity } from '../../../core/user-favorite-manager';
import { IFavoritesMetaCardConfig } from './favorite-config-mapper';
import { Observable, isObservable, of as observableOf } from 'rxjs';
import { CardStatus } from '../application-state/application-state.service';
import { UserFavorite } from '../../../store/types/user-favorites.types';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { RemoveUserFavoriteAction } from '../../../store/actions/user-favourites-actions/remove-user-favorite-action';
import { ComponentEntityMonitorConfig } from '../../shared.types';
import { entityFactory, userFavoritesSchemaKey } from '../../../store/helpers/entity-factory';

@Component({
  selector: 'app-favorites-meta-card',
  templateUrl: './favorites-meta-card.component.html',
  styleUrls: ['./favorites-meta-card.component.scss']
})
export class FavoritesMetaCardComponent implements OnInit {

  @Input()
  public favoriteEntity: IFavoriteEntity;

  @Input()
  public compact = false;

  public config: IFavoritesMetaCardConfig;

  public status$: Observable<CardStatus>;

  public favorite: UserFavorite;

  public entityConfig: ComponentEntityMonitorConfig;

  public showMore: boolean;

  public prettyName: string;

  constructor(private store: Store<AppState>) { }

  ngOnInit() {
    const { cardMapper, entity, favorite, prettyName } = this.favoriteEntity;
    this.favorite = favorite;
    this.prettyName = prettyName;
    this.entityConfig = new ComponentEntityMonitorConfig(favorite.guid, entityFactory(userFavoritesSchemaKey));
    const config = cardMapper && entity ? cardMapper(entity) : null;
    if (config) {
      config.lines = config.lines.map(line => {
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
    this.config = config;
    if (this.config && this.config.getStatus) {
      this.status$ = this.config.getStatus(entity);
    }
  }

  public removeFavorite() {
    this.store.dispatch(new RemoveUserFavoriteAction(this.favorite.guid));
  }

  public toggleMoreError() {
    this.showMore = !this.showMore;
  }

}
