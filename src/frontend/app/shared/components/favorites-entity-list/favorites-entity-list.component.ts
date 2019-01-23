import { Component, Input } from '@angular/core';
import { IFavoriteEntity } from '../../../core/user-favorite-manager';

@Component({
  selector: 'app-favorites-entity-list',
  templateUrl: './favorites-entity-list.component.html',
  styleUrls: ['./favorites-entity-list.component.scss']
})
export class FavoritesEntityListComponent {
  @Input()
  set entities(e: IFavoriteEntity[]) {
    this._entities = e ? [...e] : e;
    this.limitEntities(e, this.limit);
  }

  @Input()
  public placeholder = false;

  @Input()
  public endpointDisconnected = false;

  public _entities: IFavoriteEntity[];

  public limitedEntities: IFavoriteEntity[];
  public minLimit = 3;
  public limit = this.minLimit;

  public toggleExpand() {
    this.limit = this.limit === this.minLimit ? null : this.minLimit;
    this.limitEntities([...this._entities], this.limit);
  }

  private limitEntities(entities: IFavoriteEntity[], limit: number) {
    if (!entities || limit === null) {
      this.limitedEntities = entities;
    } else {
      this.limitedEntities = entities.splice(0, limit);
    }
  }

}
