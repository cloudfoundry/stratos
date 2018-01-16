import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../table-cell/table-cell-custom';

@Component({
  selector: 'app-table-cell-usage',
  templateUrl: './table-cell-usage.component.html',
  styleUrls: ['./table-cell-usage.component.scss']
})
export class TableCellUsageComponent<T> extends TableCellCustom<T> implements OnInit {

  private value: string;
  private label: string;

  ngOnInit() {
    this.value = this.config.value;
    this.label = this.config.label;
  }

}

