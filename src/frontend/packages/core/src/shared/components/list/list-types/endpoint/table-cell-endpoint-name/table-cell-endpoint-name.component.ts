import { Component, Input } from '@angular/core';

import { TableCellCustom } from '../../../list.types';
import { getEndpointTypes } from '../../../../../../features/endpoints/endpoint-helpers';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { EndpointsService } from '../../../../../../core/endpoints.service';

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

  getLinkForEndpoint(row = this._row) {
    return EndpointsService.getLinkForEndpoint(row);
  }
}
