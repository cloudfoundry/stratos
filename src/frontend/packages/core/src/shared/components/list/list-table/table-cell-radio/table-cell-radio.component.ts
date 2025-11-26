import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, type OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';

import { TableCellCustom } from '../../list.types';

export interface TableCellRadioConfig<T> {
  isDisabled: (row: T) => boolean;
}

@Component({
  selector: 'app-table-cell-radio',
  templateUrl: './table-cell-radio.component.html',
  styleUrls: ['./table-cell-radio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class TableCellRadioComponent<T> extends TableCellCustom<T, TableCellRadioConfig<T>> implements OnInit {
  disable!: boolean;

  constructor(private cdr: ChangeDetectorRef) {
    super();
  }

  @Input('row')
  get row() { return super.row; }
  set row(row: T) {
    super.row = row;
    if (row) {
      this.updateDisabled();
    }
  }

  ngOnInit() {
    this.updateDisabled();
  }

  updateDisabled() {
    this.disable = this.config ? this.config.isDisabled(this.row) : false;
    this.cdr.markForCheck();
  }
}
