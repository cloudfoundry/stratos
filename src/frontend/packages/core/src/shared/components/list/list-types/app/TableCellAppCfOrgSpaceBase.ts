import { Store } from '@ngrx/store';

import { AppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IApp } from '../../../../../core/cf-api.types';
import { CfOrgSpaceLabelService } from '../../../../services/cf-org-space-label.service';
import { TableCellCustom } from '../../list.types';


export class TableCellAppCfOrgSpaceBase extends TableCellCustom<APIResource<IApp>> {

  public cfOrgSpace: CfOrgSpaceLabelService;

  constructor(private store: Store<AppState>) {
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
