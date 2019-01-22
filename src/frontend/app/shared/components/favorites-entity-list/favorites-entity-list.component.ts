import { Component, Input } from '@angular/core';
import { IFavoriteEntity } from '../../../core/user-favorite-manager';

@Component({
  selector: 'app-favorites-entity-list',
  templateUrl: './favorites-entity-list.component.html',
  styleUrls: ['./favorites-entity-list.component.scss']
})
export class FavoritesEntityListComponent {
  @Input()
  set entities(e: IFavoriteEntity<any>[]) {
    this._entities = e ? [...e] : e;
    this.limitEntities(e, this.limit);
  }

  @Input()
  public placeholder = false;

  @Input()
  public endpointDisconnected = false;

  public _entities: IFavoriteEntity<any>[];

  public limitedEntities: IFavoriteEntity<any>[];
  public minLimit = 3;
  public limit = this.minLimit;

  public toggleExpand() {
    this.limit = this.limit === this.minLimit ? null : this.minLimit;
    this.limitEntities([...this._entities], this.limit);
  }

  private limitEntities(entities: IFavoriteEntity<any>[], limit: number) {
    if (!entities || limit === null) {
      this.limitedEntities = entities;
    } else {
      this.limitedEntities = entities.splice(0, limit);
    }
  }

}
