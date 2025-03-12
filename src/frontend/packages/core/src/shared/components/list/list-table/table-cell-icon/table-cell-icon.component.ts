import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../list.types';

export interface TableCellIconComponentConfig<T> {
  getIcon: (row: T) => { icon: string, font?: string, tooltip?: string; };
  size?: string;
}

@Component({
  selector: 'app-table-cell-icon',
  templateUrl: './table-cell-icon.component.html',
  styleUrls: ['./table-cell-icon.component.scss']
})
export class TableCellIconComponent<T = any> extends TableCellCustom<T, TableCellIconComponentConfig<T>> {

  @Input('row')
  get row() { return super.row; }
  set row(row: T) {
    super.row = row;
    if (this.config) {
      this.icon = this.config.getIcon(row);
    }
  }

  @Input('config')
  get config() { return super.config; }
  set config(config: TableCellIconComponentConfig<T>) {
    super.config = config;
    if (!config) {
      return;
    }
    this.icon = config.getIcon(this.row);
    this.size = config.size;
  }

  icon: { icon: string, font?: string, tooltip?: string; };
  size = '24px';
  tooltip = '';

}
