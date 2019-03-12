import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../list.types';

export interface TableCellBooleanIndicatorComponentConfig<T> {
  isEnabled: (row: T) => boolean;
  type?: string;
  subtle?: boolean;
  showText?: boolean;
}

@Component({
  selector: 'app-table-cell-boolean-indicator',
  templateUrl: './table-cell-boolean-indicator.component.html',
  styleUrls: ['./table-cell-boolean-indicator.component.scss']
})
export class TableCellBooleanIndicatorComponent<T = any> extends TableCellCustom<T> {

  private _row: T;
  @Input('row')
  get row() { return this._row; }
  set row(row: T) {
    this._row = row;
    if (this.config) {
      this.enabled = this.config.isEnabled(row);
    }
  }

  private _config: TableCellBooleanIndicatorComponentConfig<T>;
  @Input('config')
  get config() { return this._config; }
  set config(config: TableCellBooleanIndicatorComponentConfig<T>) {
    this._config = config;
    if (!config) {
      return;
    }
    this.enabled = config.isEnabled(this.row);
    this.type = config.type;
    this.subtle = config.subtle;
    this.showText = config.showText;
  }

  enabled: boolean;
  type = 'enabled-disabled';
  subtle = true;
  showText = true;

}
