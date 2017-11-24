import { Component, OnInit, ViewChild } from '@angular/core';
import { TableCellCustom } from '../../../table/table-cell/table-cell-custom';
import { CNSISModel } from '../../../../../store/types/cnsis.types';
import { TableCellEndpointStatusComponent } from '../../../table/custom-cells/table-cell-endpoint-status/table-cell-endpoint-status.component';

@Component({
  selector: 'app-card-endpoint',
  templateUrl: './card-endpoint.component.html',
  styleUrls: ['./card-endpoint.component.scss']
})
export class CardEndpointComponent extends TableCellCustom<CNSISModel> implements OnInit {
  @ViewChild('statusIcon') statusIcon: TableCellEndpointStatusComponent<CNSISModel>;

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.statusIcon.row = this.row;
  }

  getEndpointTypeString(endpoint: CNSISModel): string {
    return endpoint.cnsi_type === 'cf' ? 'Cloud Foundry' : endpoint.cnsi_type;
  }
}
