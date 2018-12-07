import { Component } from '@angular/core';

import { IServicePlan } from '../../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

@Component({
  selector: 'app-table-cell-service-plan-extras',
  templateUrl: './table-cell-service-plan-extras.component.html',
  styleUrls: ['./table-cell-service-plan-extras.component.scss'],
})
export class TableCellAServicePlanExtrasComponent extends TableCellCustom<APIResource<IServicePlan>> { }
