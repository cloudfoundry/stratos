import { Component, Input } from '@angular/core';

import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { TableCellCustom } from '../../../list.types';

interface BoundApp {
  appName: string;
  url: string;
}
@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss']
})
export class TableCellServiceInstanceAppsAttachedComponent extends TableCellCustom<APIResource<IServiceInstance>> {
  boundApps: BoundApp[];

  @Input('row')
  set row(row: any) {
    const cfGuid = this.boundApps = row ? row.entity.service_bindings.map(binding => {
      return {
        appName: binding.entity.app.entity.name,
        url: `/applications/${binding.entity.cfGuid}/${binding.entity.app.metadata.guid}`,
      };
    }) : [];
  }
}
