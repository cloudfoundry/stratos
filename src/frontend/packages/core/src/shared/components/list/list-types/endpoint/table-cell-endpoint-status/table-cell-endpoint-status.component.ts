import { Component, Input, OnInit } from '@angular/core';

import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';
import { TableCellCustom } from '../../../list.types';
import { EntityCatalogueService } from '../../../../../../core/entity-catalogue/entity-catalogue.service';

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

  constructor(private entityCatalogueService: EntityCatalogueService) {
    super();
  }

  ngOnInit() {
    const ep = this.entityCatalogueService.getEndpoint(this.row.cnsi_type, this.row.sub_type);
    if (!!ep) {
      this.connectable = !ep.entity.unConnectable;
    }
  }
}
