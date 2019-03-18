import { Component, Input, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../list.types';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss']
})
export class TableCellEndpointStatusComponent extends TableCellCustom<EndpointModel> implements OnInit {

  public connectable = true;

  @Input() row: EndpointModel;

  constructor() {
    super();
  }

  ngOnInit() {
    const ep = getEndpointType(this.row.cnsi_type, this.row.sub_type);
    if (!!ep) {
      this.connectable = !ep.doesNotSupportConnect;
    }
  }
}
