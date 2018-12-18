import { Component } from '@angular/core';

import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';
import { ListCfRoute } from '../cf-routes-data-source-base';

@Component({
  selector: 'app-table-cell-tcp-route',
  templateUrl: './table-cell-tcproute.component.html',
  styleUrls: ['./table-cell-tcproute.component.scss']
})
export class TableCellTCPRouteComponent extends TableCellCustom<APIResource<ListCfRoute>> { }
