import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';

import { EndpointsSignalService, TableCellCustom } from '@stratosui/core';
import { CfCurrentUserRolesSignalService } from '../../../../../user-permissions/cf-current-user-roles-signal.service';
import { StServiceOffering } from '../../../../../services/endpoint-data/stratos-types';
import { CfOrgSpaceLabelService } from '../../../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from '../../../../components/cf-org-space-links/cf-org-space-links.component';

@Component({
  selector: 'app-table-cell-service-cf-breadcrumbs',
  templateUrl: './table-cell-service-cf-breadcrumbs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CfOrgSpaceLinksComponent
  ]
})
export class TableCellServiceCfBreadcrumbsComponent extends TableCellCustom<StServiceOffering> {

  cfOrgSpace!: CfOrgSpaceLabelService;
  private endpoints = inject(EndpointsSignalService);
  private cfRoles = inject(CfCurrentUserRolesSignalService);

  @Input()
  set row(offering: StServiceOffering) {
    super.row = offering;
    if (!offering || !!this.cfOrgSpace) {
      return;
    }
    this.cfOrgSpace = new CfOrgSpaceLabelService(this.endpoints, this.cfRoles, offering.cnsiGuid);
  }

  constructor() {
    super();
  }

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });
}
