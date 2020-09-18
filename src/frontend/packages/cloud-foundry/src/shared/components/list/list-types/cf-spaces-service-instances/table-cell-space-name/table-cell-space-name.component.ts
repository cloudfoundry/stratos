import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-space-name',
  templateUrl: './table-cell-space-name.component.html',
  styleUrls: ['./table-cell-space-name.component.scss']
})
export class TableCellSpaceNameComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

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
