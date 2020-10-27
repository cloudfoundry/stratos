import { Component, Input } from '@angular/core';

import { TableCellCustomComponent } from '../../list.types';

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
export class TableCellBooleanIndicatorComponent<T = any> extends TableCellCustomComponent<T, TableCellBooleanIndicatorComponentConfig<T>> {

  @Input('row')
  get row() { return this.pRow; }
  set row(row: T) {
    this.pRow = row;
    if (this.config) {
      this.enabled = this.config.isEnabled(row);
    }
  }

  @Input('config')
  get config() { return this.pConfig; }
  set config(config: TableCellBooleanIndicatorComponentConfig<T>) {
    this.pConfig = config;
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
