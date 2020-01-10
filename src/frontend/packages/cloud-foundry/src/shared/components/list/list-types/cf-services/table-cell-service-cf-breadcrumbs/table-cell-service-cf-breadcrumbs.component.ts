import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import { IService } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { CfOrgSpaceLabelService } from '../../../../../../../../core/src/shared/services/cf-org-space-label.service';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { CFAppState } from '../../../../../../cf-app-state';

@Component({
  selector: 'app-table-cell-service-cf-breadcrumbs',
  templateUrl: './table-cell-service-cf-breadcrumbs.component.html',
  styleUrls: ['./table-cell-service-cf-breadcrumbs.component.scss']
})
export class TableCellServiceCfBreadcrumbsComponent extends TableCellCustom<APIResource<IService>> {

  cfOrgSpace: CfOrgSpaceLabelService;

  @Input()
  set row(pService: APIResource<IService>) {
    if (!pService || !!this.cfOrgSpace) {
      return;
    }
    this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, pService.entity.cfGuid);
  }

  constructor(private store: Store<CFAppState>) {
    super();
  }

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });
}
