import { Component, OnInit, Input } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { APIResource } from '../../../../../../store/types/api.types';
import { CfServiceInstance } from '../../../../../../store/types/service.types';
import { AppChip } from '../../../../chips/chips.component';

interface Tag {
  value: string;
  key: APIResource<CfServiceInstance>;
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
