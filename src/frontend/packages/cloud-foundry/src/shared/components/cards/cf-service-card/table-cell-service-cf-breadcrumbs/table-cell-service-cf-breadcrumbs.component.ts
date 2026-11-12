import { Component, computed, inject, untracked, ChangeDetectionStrategy } from '@angular/core';

import { EndpointsSignalService, TableCellCustom } from '@stratosui/core';
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

  private endpoints = inject(EndpointsSignalService);

  // One label service per endpoint; built untracked so that it depends on
  // the row's endpoint alone.
  private readonly cnsiGuid = computed(() => this.row()?.cnsiGuid);
  readonly cfOrgSpace = computed(() => {
    const cnsiGuid = this.cnsiGuid();
    return untracked(() => new CfOrgSpaceLabelService(this.endpoints, cnsiGuid));
  });

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });
}
