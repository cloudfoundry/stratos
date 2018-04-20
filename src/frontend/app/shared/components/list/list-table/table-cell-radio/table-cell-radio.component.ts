import { Component, Input, OnInit } from '@angular/core';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { TableCellCustom } from '../../list.types';

@Component({
  selector: 'app-table-cell-radio',
  templateUrl: './table-cell-radio.component.html',
  styleUrls: ['./table-cell-radio.component.scss']
})
export class TableCellRadioComponent<T> extends TableCellCustom<T> implements OnInit {
  disable: boolean;

  ngOnInit() {
    this.disable = this.config ? this.config.isDisabled() : false;
  }
}
