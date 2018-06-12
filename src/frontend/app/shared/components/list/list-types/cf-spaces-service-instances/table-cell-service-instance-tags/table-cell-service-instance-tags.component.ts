import { Component, Input, OnInit } from '@angular/core';
import { of as observableOf } from 'rxjs';

import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { TableCellCustom } from '../../../list.types';

interface Tag {
  value: string;
  key: APIResource<IServiceInstance>;
}
@Component({
  selector: 'app-table-cell-service-instance-tags',
  templateUrl: './table-cell-service-instance-tags.component.html',
  styleUrls: ['./table-cell-service-instance-tags.component.scss']
})
export class TableCellServiceInstanceTagsComponent<T> extends TableCellCustom<T> {

  tags: AppChip<Tag>[] = [];
  @Input('row')
  set row(row) {
    if (row) {
      this.tags.length = 0;
      if (row.entity && row.entity.service_instance) {
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
