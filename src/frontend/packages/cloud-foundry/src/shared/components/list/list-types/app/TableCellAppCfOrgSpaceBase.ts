import { EndpointsSignalService } from '@stratosui/core';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IApp } from '../../../../../cf-api.types';
import { CfCurrentUserRolesSignalService } from '../../../../../user-permissions/cf-current-user-roles-signal.service';
import { CfOrgSpaceLabelService } from '../../../../services/cf-org-space-label.service';


export class TableCellAppCfOrgSpaceBase extends TableCellCustom<APIResource<IApp>> {

  public cfOrgSpace!: CfOrgSpaceLabelService;

  constructor(
    private endpoints: EndpointsSignalService,
    private cfRoles: CfCurrentUserRolesSignalService,
  ) {
    super();
  }

  protected init(cfGuid?: string, orgGuid?: string, spaceGuid?: string) {
    if (!this.cfOrgSpace) {
      this.cfOrgSpace = new CfOrgSpaceLabelService(
        this.endpoints,
        this.cfRoles,
        cfGuid,
        orgGuid,
        spaceGuid
      );
    }
  }

}
