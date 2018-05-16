import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TableCellCustom } from '../../../list.types';
import { IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { APIResource } from '../../../../../../store/types/api.types';

interface BoundApp {
  appName: string;
  url: string;
}
@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss']
})
export class TableCellServiceInstanceAppsAttachedComponent extends TableCellCustom<APIResource<IServiceInstance>> implements OnInit {
  cfGuid: any;

  boundApps: BoundApp[];
  @Input('row')
  set row(row: any) {
    this.boundApps = row ? row.entity.service_bindings
      .map(a => {
        return {
          appName: a.entity.app.entity.name,
          url: `/applications/${this.cfGuid}/${a.entity.app.metadata.guid}`,
          params: { breadcrumbs: 'space-services' }
        };
      }) : [];
  }

  constructor(private activatedRoute: ActivatedRoute) {
    super();
  }

  ngOnInit() {
    const parentRoute = this.activatedRoute.pathFromRoot.filter(route => !!route.snapshot.params['cfId'])[0];
    this.cfGuid = parentRoute && parentRoute.snapshot.params['cfId'];
  }

}
