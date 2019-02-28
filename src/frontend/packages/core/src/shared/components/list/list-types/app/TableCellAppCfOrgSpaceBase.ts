import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { IApp } from '../../../../../core/cf-api.types';
import { haveMultiConnectedCfs } from '../../../../../features/cloud-foundry/cf.helpers';
import { TableCellCustom } from '../../list.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../store/src/app-state';


export class TableCellAppCfOrgSpaceBase extends TableCellCustom<APIResource<IApp>> {

  multipleConnectedEndpoints$: Observable<boolean>;

  constructor(store: Store<AppState>) {
    super();
    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(store);
  }


}
