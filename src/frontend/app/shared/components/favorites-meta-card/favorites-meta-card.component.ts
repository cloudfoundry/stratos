import { Component, Input, OnInit } from '@angular/core';
import { IFavoriteEntity } from '../../../core/user-favorite-manager';
import { IFavoritesMetaCardConfig } from './favorite-to-card-config-mapper';
import { Observable } from 'rxjs';
import { CardStatus } from '../application-state/application-state.service';



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

  constructor() {

  }

  ngOnInit() {
    const { cardMapper, entity } = this.favoriteEntity;
    this.config = cardMapper && entity ? cardMapper(entity) : null;
    if (this.config && this.config.getStatus) {
      this.status$ = this.config.getStatus(entity);
    }
  }

}
