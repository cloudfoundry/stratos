import { Component, Input } from '@angular/core';

import { IService, IServiceExtra } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-service-provider',
  templateUrl: './table-cell-service-provider.component.html',
  styleUrls: ['./table-cell-service-provider.component.scss']
})
export class TableCellServiceProviderComponent extends TableCellCustom<APIResource<IService>>  {

  extraInfo: IServiceExtra;

  @Input()
  set row(pService: APIResource<IService>) {
    if (!!pService && !!pService.entity.extra && !this.extraInfo) {
      try {
        this.extraInfo = JSON.parse(pService.entity.extra);
      } catch { }
    }
  }

  constructor() {
    super();
  }

}
