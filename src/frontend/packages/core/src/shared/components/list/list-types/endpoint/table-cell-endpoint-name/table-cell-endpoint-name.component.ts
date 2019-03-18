import { Component, Input, OnInit } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { TableCellCustom } from '../../../list.types';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  styleUrls: ['./table-cell-endpoint-name.component.scss']
})
export class TableCellEndpointNameComponent extends TableCellCustom<EndpointModel> implements OnInit {

  public canShowLink = false;

  private tableRow: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    this.tableRow = row;
  }
  get row(): EndpointModel {
    return this.tableRow;
  }

  getLinkForEndpoint(row = this.tableRow) {
    return EndpointsService.getLinkForEndpoint(row);
  }

  ngOnInit() {
    const ep = getEndpointType(this.row.cnsi_type, this.row.sub_type);
    this.canShowLink = (this.row as any).connectionStatus === 'connected' || ep.doesNotSupportConnect;
  }

}
