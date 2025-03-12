import { Component, Input, OnInit } from '@angular/core';
import { entityCatalog, EndpointModel } from '@stratosui/store';

import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss']
})
export class TableCellEndpointStatusComponent extends TableCellCustom<EndpointModel, { showLabel: boolean; }> implements OnInit {

  public connectable = true;

  @Input()
  get row(): EndpointModel {
    return super.row;
  }
  set row(row: EndpointModel) {
    super.row = row;
  }

  constructor() {
    super();
    this.config = {
      showLabel: true,
    };
  }

  ngOnInit() {
    const ep = entityCatalog.getEndpoint(this.row.cnsi_type, this.row.sub_type);
    if (!!ep) {
      this.connectable = !ep.definition.unConnectable;
    }
  }
}
