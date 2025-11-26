import { Component, Input , ChangeDetectionStrategy } from '@angular/core';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IService, IServiceExtra } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-service-provider',
  templateUrl: './table-cell-service-provider.component.html',
  styleUrls: ['./table-cell-service-provider.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class TableCellServiceProviderComponent extends TableCellCustom<APIResource<IService>>  {

  extraInfo!: IServiceExtra;

  @Input()
  set row(pService: APIResource<IService>) {
    super.row = pService;
    if (!!pService && !!pService.entity.extra && !this.extraInfo) {
      try {
        this.extraInfo = JSON.parse(pService.entity.extra);
      } catch { }
    }
  }

}
