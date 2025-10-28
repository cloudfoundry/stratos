import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';

import { TableCellCustom } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IService } from '../../../../../../cf-api-svc.types';
import { CFAppState } from '../../../../../../cf-app-state';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from '../../../../../components/cf-org-space-links/cf-org-space-links.component';

@Component({
  selector: 'app-table-cell-service-cf-breadcrumbs',
  templateUrl: './table-cell-service-cf-breadcrumbs.component.html',
  styleUrls: ['./table-cell-service-cf-breadcrumbs.component.scss'],
  standalone: true,
  imports: [
    CfOrgSpaceLinksComponent
  ]
})
export class TableCellServiceCfBreadcrumbsComponent extends TableCellCustom<APIResource<IService>> {

  cfOrgSpace: CfOrgSpaceLabelService;

  @Input()
  set row(pService: APIResource<IService>) {
    super.row = pService;
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
