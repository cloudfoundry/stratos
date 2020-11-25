import { Component, Input } from '@angular/core';

import { FavoritesConfigMapper } from '../../../../../../../store/src/favorite-config-mapper';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { TableCellCustom } from '../../list.types';
import { ITableColumn } from '../table.types';

export interface TableCellFavoriteComponentConfig<T, Y extends IFavoriteMetadata> {
  createUserFavorite: (entity: T) => UserFavorite<Y>;
}

@Component({
  selector: 'app-table-cell-favorite',
  templateUrl: './table-cell-favorite.component.html',
  styleUrls: ['./table-cell-favorite.component.scss']
})
export class TableCellFavoriteComponent<T, Y extends IFavoriteMetadata> extends
  TableCellCustom<T, TableCellFavoriteComponentConfig<T, Y>> {

  constructor(private favoritesConfigMapper: FavoritesConfigMapper) {
    super();
  }

  public favorite: UserFavorite<Y>;
  public canFavorite = false;

  @Input('config')
  set config(config: TableCellFavoriteComponentConfig<T, Y>) {
    super.config = config;
    this.createUserFavorite();
  }

  @Input('row')
  set row(row: T) {
    super.row = row;
    this.createUserFavorite();
  }

  private createUserFavorite() {
    if (this.row && this.config) {
      this.favorite = this.config.createUserFavorite(this.row);
      this.canFavorite = !!this.favoritesConfigMapper.getMapperFunction(this.favorite);
    }
  }
}

export function createTableColumnFavorite<T, Y extends IFavoriteMetadata>(
  createUserFavorite: (entity: T) => UserFavorite<Y>
): ITableColumn<T> {
  const cellConfig: TableCellFavoriteComponentConfig<T, Y> = {
    createUserFavorite
  };
  return {
    columnId: 'favorite',
    headerCell: () => '',
    cellComponent: TableCellFavoriteComponent,
    cellFlex: '0 0 100px',
    cellConfig
  };
}
