import { Component, Input, OnInit } from '@angular/core';

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
export class TableCellServiceInstanceTagsComponent<T> extends TableCellCustom<T> implements OnInit {

  tags: AppChip<Tag>[] = [];
  @Input('row') row;
  constructor() {
    super();
  }

  ngOnInit() {
    this.row.entity.tags.forEach(t => {
      this.tags.push({
        value: t,
        key: this.row,
        hideClearButton: true
      });
    });
  }

}
