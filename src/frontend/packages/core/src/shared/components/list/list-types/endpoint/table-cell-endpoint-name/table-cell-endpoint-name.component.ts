import { Component, OnInit } from '@angular/core';

import { TableCellCustom } from '../../../list.types';
import { getEndpointTypes, getEndpointType } from '../../../../../../features/endpoints/endpoint-helpers';

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  styleUrls: ['./table-cell-endpoint-name.component.scss']
})
export class TableCellEndpointNameComponent<T> extends TableCellCustom<T> implements OnInit {

  public canShowLink = false;

  getLinkForEndpoint(row) {
    const ext = getEndpointTypes().find(ep => ep.value === row.cnsi_type);
    if (ext && ext.homeLink) {
      return ext.homeLink(row.guid).join('/');
    }
    return '';
  }

  ngOnInit() {
    const ep = getEndpointType((this.row as any).cnsi_type);
    this.canShowLink = (this.row as any).connectionStatus === 'connected' || ep.doesNotSupportConnect;
  }

}
