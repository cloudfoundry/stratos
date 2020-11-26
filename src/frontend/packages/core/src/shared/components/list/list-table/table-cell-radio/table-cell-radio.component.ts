import { Component, Input, OnInit } from '@angular/core';

import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-radio',
  templateUrl: './table-cell-radio.component.html',
  styleUrls: ['./table-cell-radio.component.scss']
})
export class TableCellRadioComponent<T> extends TableCellCustom<T> implements OnInit {
  disable: boolean;

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
  }
}
