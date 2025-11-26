import { Component , ChangeDetectionStrategy } from '@angular/core';

import { BooleanIndicatorComponent, TableCellCustom } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IService } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-active',
  templateUrl: './table-cell-service-active.component.html',
  styleUrls: ['./table-cell-service-active.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BooleanIndicatorComponent
  ]
})
export class TableCellServiceActiveComponent extends TableCellCustom<APIResource<IService>>  { }
