import { Component, Input } from '@angular/core';
import { of as observableOf } from 'rxjs';

import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance, IUserProvidedServiceInstance } from '../../../../../../cf-api-svc.types';

interface Tag {
  value: string;
  key: APIResource<IServiceInstance>;
}
@Component({
  selector: 'app-table-cell-service-instance-tags',
  templateUrl: './table-cell-service-instance-tags.component.html',
  styleUrls: ['./table-cell-service-instance-tags.component.scss']
})
export class TableCellServiceInstanceTagsComponent
  extends TableCellCustom<APIResource<IServiceInstance> | APIResource<IUserProvidedServiceInstance>> {

  tags: AppChip<Tag>[] = [];
  @Input('row')
  set row(row) {
    if (row) {
      this.tags.length = 0;
      if (row.entity && row.entity.service_instance && row.entity.service_instance.entity.tags) {
        row.entity.service_instance.entity.tags.forEach(t => {
          this.tags.push({
            value: t,
            key: row,
            hideClearButton$: observableOf(true)
          });
        });
      } else if (row.entity && row.entity.tags) {
        row.entity.tags.forEach(t => {
          this.tags.push({
            value: t,
            key: row,
            hideClearButton$: observableOf(true)
          });
        });
      }
    }
  }

  constructor() {
    super();
  }

}
