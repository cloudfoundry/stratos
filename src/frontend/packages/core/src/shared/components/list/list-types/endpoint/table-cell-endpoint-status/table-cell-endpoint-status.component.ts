import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../list.types';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss']
})
export class TableCellEndpointStatusComponent<T> extends TableCellCustom<T> implements OnInit {

  public connectable = true;

  constructor() {
    super();
  }

  ngOnInit() {
    const ep = getEndpointType((this.row as any).cnsi_type);
    if (!!ep) {
      this.connectable = !ep.doesNotSupportConnect;
    }
  }
}
