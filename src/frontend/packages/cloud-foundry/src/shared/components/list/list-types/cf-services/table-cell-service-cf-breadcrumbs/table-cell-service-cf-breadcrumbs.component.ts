import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';

import { TableCellCustom } from '@stratosui/core';
import type { APIResource, GeneralEntityAppState } from '@stratosui/store';
import type { IService } from '../../../../../../cf-api-svc.types';
import type { CFAppState } from '../../../../../../cf-app-state';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from '../../../../../components/cf-org-space-links/cf-org-space-links.component';

@Component({
  selector: 'app-table-cell-service-cf-breadcrumbs',
  templateUrl: './table-cell-service-cf-breadcrumbs.component.html',
  styleUrls: ['./table-cell-service-cf-breadcrumbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CfOrgSpaceLinksComponent
  ]
})
export class TableCellServiceCfBreadcrumbsComponent extends TableCellCustom<APIResource<IService>> {

  cfOrgSpace!: CfOrgSpaceLabelService;
  private store = inject(Store<GeneralEntityAppState>);

  @Input()
  set row(pService: APIResource<IService>) {
    super.row = pService;
    if (!pService || !!this.cfOrgSpace) {
      return;
    }
    this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, pService.entity.cfGuid);
  }

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });
}
