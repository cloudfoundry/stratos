import { Component, Input } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  styleUrls: ['./table-cell-endpoint-name.component.scss']
})
export class TableCellEndpointNameComponent extends TableCellCustom<EndpointModel> {

  private _row: EndpointModel;
  @Input('row')
  set row(row: EndpointModel) {
    this._row = row;
  }
  get row(): EndpointModel {
    return this._row;
  }

  getLinkForEndpoint(row = this._row) {
    return EndpointsService.getLinkForEndpoint(row);
  }
}
