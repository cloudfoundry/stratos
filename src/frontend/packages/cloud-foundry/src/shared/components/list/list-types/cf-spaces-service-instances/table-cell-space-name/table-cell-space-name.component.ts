import { Component, OnInit , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IServiceInstance } from '../../../../../../cf-api-svc.types';

@Component({
  selector: 'app-table-cell-space-name',
  templateUrl: './table-cell-space-name.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule
  ]
})
export class TableCellSpaceNameComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {

  breadcrumbs!: Record<string, unknown>;
  spaceUrl!: string[];
  spaceName!: Observable<string>;

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
