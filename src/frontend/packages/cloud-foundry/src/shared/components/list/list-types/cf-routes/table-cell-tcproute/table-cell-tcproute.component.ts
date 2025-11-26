import { Component , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent } from '@stratosui/core';
import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { ListCfRoute } from '../cf-routes-data-source-base';

@Component({
  selector: 'app-table-cell-tcp-route',
  templateUrl: './table-cell-tcproute.component.html',
  styleUrls: ['./table-cell-tcproute.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellTCPRouteComponent extends TableCellCustom<APIResource<ListCfRoute>> { }
