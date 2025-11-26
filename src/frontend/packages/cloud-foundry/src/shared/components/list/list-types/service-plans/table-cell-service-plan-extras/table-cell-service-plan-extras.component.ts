
import { Component , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { IServicePlan } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-plan-extras',
  templateUrl: './table-cell-service-plan-extras.component.html',
  styleUrls: ['./table-cell-service-plan-extras.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class TableCellAServicePlanExtrasComponent extends TableCellCustom<APIResource<IServicePlan>> { }
