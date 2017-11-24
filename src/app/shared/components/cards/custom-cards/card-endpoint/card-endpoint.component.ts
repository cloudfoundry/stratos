import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';
import { CNSISModel } from '../../../../../store/types/cnsis.types';

@Component({
  selector: 'app-card-endpoint',
  templateUrl: './card-endpoint.component.html',
  styleUrls: ['./card-endpoint.component.scss']
})
export class CardEndpointComponent extends TableCellCustom<CNSISModel> {

  getEndpointTypeString(endpoint: CNSISModel): string {
    return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
  }
}
