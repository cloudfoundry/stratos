import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';

import { EndpointsSignalService } from '@stratosui/core';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IApp, ISpace } from '../../../../../../cf-api.types';
import { CfCurrentUserRolesSignalService } from '../../../../../../user-permissions/cf-current-user-roles-signal.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { TableCellAppCfOrgSpaceBase } from '../TableCellAppCfOrgSpaceBase';

@Component({
  selector: 'app-table-cell-app-cforgspace',
  templateUrl: './table-cell-app-cforgspace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CfOrgSpaceLinksComponent
  ]
})
export class TableCellAppCfOrgSpaceComponent extends TableCellAppCfOrgSpaceBase {

  @Input()
  set row(row: APIResource<IApp>) {
    super.row = row;
    if (row) {
      this.init(row.entity.cfGuid, (row.entity.space as APIResource<ISpace>).entity.organization_guid, row.entity.space_guid);
    }
  }

  constructor() {
    super(inject(EndpointsSignalService), inject(CfCurrentUserRolesSignalService));
  }

}
