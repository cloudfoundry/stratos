import { Store } from '@ngrx/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type { GeneralEntityAppState } from '../../../../../../../store/src/app-state';
import { TableCellCustom } from '@stratosui/core';
import type { APIResource } from '../../../../../../../store/src/types/api.types';
import type { IApp } from '../../../../../cf-api.types';
import { CfOrgSpaceLabelService } from '../../../../services/cf-org-space-label.service';


export class TableCellAppCfOrgSpaceBase extends TableCellCustom<APIResource<IApp>> {

  public cfOrgSpace!: CfOrgSpaceLabelService;

  constructor(private store: Store<GeneralEntityAppState>) {
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
