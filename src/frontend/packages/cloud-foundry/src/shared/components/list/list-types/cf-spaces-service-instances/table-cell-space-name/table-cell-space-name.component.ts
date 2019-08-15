import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { IServiceInstance } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

@Component({
  selector: 'app-table-cell-space-name',
  templateUrl: './table-cell-space-name.component.html',
  styleUrls: ['./table-cell-space-name.component.scss']
})
export class TableCellSpaceNameComponent<T> extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  breadcrumbs: {};
  spaceUrl: string[];
  spaceName: Observable<string>;
  @Input() row;
  constructor() {
    super();
  }
  ngOnInit(): void {
    this.spaceUrl = [
      '/cloud-foundry',
      this.row.entity.cfGuid,
      'organizations',
      this.row.entity.space.entity.organization_guid,
      'spaces',
      this.row.entity.space_guid,
      'summary'
    ];
    this.breadcrumbs = { breadcrumbs: 'services-wall' };
  }
}
