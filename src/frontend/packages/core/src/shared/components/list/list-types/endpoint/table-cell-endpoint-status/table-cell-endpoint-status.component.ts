import { Component, Input, OnInit } from '@angular/core';

import { entityCatalog } from '../../../../../../../../store/src/entity-catalog/entity-catalog';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-endpoint-status',
  templateUrl: './table-cell-endpoint-status.component.html',
  styleUrls: ['./table-cell-endpoint-status.component.scss']
})
export class TableCellEndpointStatusComponent extends TableCellCustom<EndpointModel> implements OnInit {

  public connectable = true;

  @Input() row: EndpointModel;
  @Input() config: { showLabel: boolean } = {
    showLabel: true
  };

  constructor() {
    super();
  }

  ngOnInit() {
    const ep = entityCatalog.getEndpoint(this.row.cnsi_type, this.row.sub_type);
    if (!!ep) {
      this.connectable = !ep.definition.unConnectable;
    }
  }
}
