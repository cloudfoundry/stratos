import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject } from '@angular/core';

import { BooleanIndicatorComponent } from '../../../boolean-indicator/boolean-indicator.component';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellBooleanIndicatorComponent<T = any> extends TableCellCustom<T, TableCellBooleanIndicatorComponentConfig<T>> {
  private cdr = inject(ChangeDetectorRef);


  @Input('row')
  get row() { return super.row; }
  set row(row: T) {
    super.row = row;
    if (this.config) {
      this.enabled = this.config.isEnabled(row);
      this.cdr.markForCheck();
    }
  }

  @Input('config')
  get config() { return super.config; }
  set config(config: TableCellBooleanIndicatorComponentConfig<T>) {
    super.config = config;
    if (!config) {
      return;
    }
    this.enabled = config.isEnabled(this.row);
    this.type = config.type;
    this.subtle = config.subtle;
    this.showText = config.showText;
  }

  enabled!: boolean;
  type = 'enabled-disabled';
  subtle = true;
  showText = true;

}
