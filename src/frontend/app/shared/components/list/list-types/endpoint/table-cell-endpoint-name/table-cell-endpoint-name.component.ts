import { Component } from '@angular/core';

import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-endpoint-name',
  templateUrl: './table-cell-endpoint-name.component.html',
  styleUrls: ['./table-cell-endpoint-name.component.scss']
})
export class TableCellEndpointNameComponent<T> extends TableCellCustom<T> {

  getLinkForEndpoint(row) {
    switch (row.cnsi_type) {
      case 'cf':
        return '/cloud-foundry/' + row.guid;
      case 'metrics':
        return '/endpoints/metrics/' + row.guid;
      default:
        return '';
    }

  }
}
