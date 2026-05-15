import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@stratosui/store';

import { TableCellCustom } from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IService } from '../../../../../../cf-api-svc.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { CfCurrentUserRolesSignalService } from '../../../../../../user-permissions/cf-current-user-roles-signal.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from '../../../../../components/cf-org-space-links/cf-org-space-links.component';

@Component({
  selector: 'app-table-cell-service-cf-breadcrumbs',
  templateUrl: './table-cell-service-cf-breadcrumbs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CfOrgSpaceLinksComponent
  ]
})
export class TableCellServiceCfBreadcrumbsComponent extends TableCellCustom<APIResource<IService>> {

  cfOrgSpace!: CfOrgSpaceLabelService;
  private store = inject(Store<CFAppState>);
  private cfRoles = inject(CfCurrentUserRolesSignalService);

  @Input()
  set row(pService: APIResource<IService>) {
    super.row = pService;
    if (!pService || !!this.cfOrgSpace) {
      return;
    }
    this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, this.cfRoles, pService.entity.cfGuid);
  }

  constructor() {
    super();
  }

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });
}
