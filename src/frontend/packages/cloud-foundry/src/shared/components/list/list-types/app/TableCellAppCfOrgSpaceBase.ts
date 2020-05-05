import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IApp } from '../../../../../cf-api.types';
import { CfOrgSpaceLabelService } from '../../../../services/cf-org-space-label.service';


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
