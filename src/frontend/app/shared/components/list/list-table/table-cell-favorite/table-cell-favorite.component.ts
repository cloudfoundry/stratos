import { Component, Input } from '@angular/core';

import { UserFavorite } from '../../../../../store/types/user-favorites.types';
import { TableCellCustom } from '../../list.types';
import { ITableColumn } from '../table.types';

export interface TableCellFavoriteComponentConfig<T> {
  createUserFavorite: (entity: T) => UserFavorite;
}

export function createTableColumnFavorite<T>(createUserFavorite: (entity: T) => UserFavorite): ITableColumn<T> {
  const cellConfig: TableCellFavoriteComponentConfig<T> = {
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

@Component({
  selector: 'app-table-cell-favorite',
  templateUrl: './table-cell-favorite.component.html',
  styleUrls: ['./table-cell-favorite.component.scss']
})
export class TableCellFavoriteComponent<T> extends TableCellCustom<T> {

  favorite: UserFavorite;

  private _config: TableCellFavoriteComponentConfig<T>;
  @Input('config')
  get config() { return this._config; }
  set config(config: TableCellFavoriteComponentConfig<T>) {
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
      this.favorite = this.config.createUserFavorite(this.row);
    }
  }
}
