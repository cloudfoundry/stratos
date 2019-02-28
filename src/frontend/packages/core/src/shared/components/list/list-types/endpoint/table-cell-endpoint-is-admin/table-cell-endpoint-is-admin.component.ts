import { Component } from '@angular/core';

import { TableCellCustom } from '../../../list.types';

/* tslint:disable:no-access-missing-member https://github.com/mgechev/codelyzer/issues/191*/
@Component({
  selector: 'app-table-cell-endpoint-is-admin',
  templateUrl: './table-cell-endpoint-is-admin.component.html',
  styleUrls: ['./table-cell-endpoint-is-admin.component.scss']
})
export class TableCellEndpointIsAdminComponent<T> extends TableCellCustom<T> { }
