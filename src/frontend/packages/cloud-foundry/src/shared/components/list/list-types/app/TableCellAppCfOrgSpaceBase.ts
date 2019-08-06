import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { IApp } from '../../../../../../../core/src/core/cf-api.types';
import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { CfOrgSpaceLabelService } from '../../../../../../../core/src/shared/services/cf-org-space-label.service';
import { APIResource } from '../../../../../../../store/src/types/api.types';


export class TableCellAppCfOrgSpaceBase extends TableCellCustom<APIResource<IApp>> {

  public cfOrgSpace: CfOrgSpaceLabelService;

  constructor(private store: Store<CFAppState>) {
    super();
  }

  protected init(cfGuid?: string, orgGuid?: string, spaceGuid?: string) {
    if (!this.cfOrgSpace) {
      this.cfOrgSpace = new CfOrgSpaceLabelService(
        this.store,
        cfGuid,
        orgGuid,
        spaceGuid
      );
    }
  }

}
