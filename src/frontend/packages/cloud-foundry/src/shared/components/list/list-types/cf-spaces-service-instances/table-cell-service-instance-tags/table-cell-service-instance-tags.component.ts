import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { of as observableOf } from 'rxjs';

import { type AppChip, AppChipsComponent } from '@stratosui/core';
import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../../store/src/types/api.types';
import type { IServiceInstance, IUserProvidedServiceInstance } from '../../../../../../cf-api-svc.types';

function isUserProvidedServiceInstance(
  entity: IServiceInstance | IUserProvidedServiceInstance
): entity is IUserProvidedServiceInstance {
  return 'tags' in entity;
}

@Component({
  selector: 'app-table-cell-service-instance-tags',
  templateUrl: './table-cell-service-instance-tags.component.html',
  styleUrls: ['./table-cell-service-instance-tags.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppChipsComponent
  ]
})
export class TableCellServiceInstanceTagsComponent
  extends TableCellCustom<APIResource<IServiceInstance> | APIResource<IUserProvidedServiceInstance>> {

  tags: AppChip<IServiceInstance | IUserProvidedServiceInstance>[] = [];

  @Input('row')
  override set row(row: APIResource<IServiceInstance> | APIResource<IUserProvidedServiceInstance>) {
    this.pRow = row;
    if (row?.entity) {
      this.tags.length = 0;
      // Only user-provided service instances have tags
      if (isUserProvidedServiceInstance(row.entity) && row.entity.tags) {
        row.entity.tags.forEach((t: string) => {
          this.tags.push({
            value: t,
            key: row.entity,
            hideClearButton$: observableOf(true)
          });
        });
      }
    }
  }

  override get row(): APIResource<IServiceInstance> | APIResource<IUserProvidedServiceInstance> {
    return this.pRow;
  }
}
