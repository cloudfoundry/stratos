import { Component } from '@angular/core';

import { TableCellCustomComponent } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-bindable',
  templateUrl: './table-cell-service-bindable.component.html',
  styleUrls: ['./table-cell-service-bindable.component.scss']
})
export class TableCellServiceBindableComponent extends TableCellCustomComponent<APIResource<IService>>  { }
