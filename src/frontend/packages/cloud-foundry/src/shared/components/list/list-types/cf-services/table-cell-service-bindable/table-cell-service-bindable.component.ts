import { Component, Input } from '@angular/core';

import { IService } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-service-bindable',
  templateUrl: './table-cell-service-bindable.component.html',
  styleUrls: ['./table-cell-service-bindable.component.scss']
})
export class TableCellServiceBindableComponent extends TableCellCustom<APIResource<IService>>  {

  @Input() row: APIResource<IService>;

  constructor() {
    super();
  }
}
