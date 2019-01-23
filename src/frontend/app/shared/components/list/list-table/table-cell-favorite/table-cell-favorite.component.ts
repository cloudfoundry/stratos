import { Component, Input } from '@angular/core';

import { UserFavorite, IFavoriteMetadata } from '../../../../../store/types/user-favorites.types';
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
export class TableCellFavoriteComponent<T, Y extends IFavoriteMetadata> extends TableCellCustom<T> {

  public favorite: UserFavorite<Y>;

  private _config: TableCellFavoriteComponentConfig<T, Y>;
  @Input('config')
  get config() { return this._config; }
  set config(config: TableCellFavoriteComponentConfig<T, Y>) {
    this._config = config;
    this.createUserFavorite();
  }

  private _row: T;
  @Input('row')
  get row() { return this._row; }
  set row(row: T) {
    this._row = row;
    this.createUserFavorite();
  }

  private createUserFavorite() {
    if (this.row && this.config) {
      debugger;
      this.favorite = this.config.createUserFavorite(this.row);
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
    headerCell: () => 'Favorite',
    cellComponent: TableCellFavoriteComponent,
    cellFlex: '0 0 100px',
    cellConfig
  };
}
