import { Component } from '@angular/core';

import { BooleanIndicatorComponent } from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ListCfRoute } from '../cf-routes-data-source-base';

@Component({
  selector: 'app-table-cell-tcp-route',
  templateUrl: './table-cell-tcproute.component.html',
  styleUrls: ['./table-cell-tcproute.component.scss'],
  standalone: true,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellTCPRouteComponent extends TableCellCustom<APIResource<ListCfRoute>> { }
