import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { IApp } from '../../../../../core/cf-api.types';
import { haveMultiConnectedCfs } from '../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { TableCellCustom } from '../../list.types';


export class TableCellAppCfOrgSpaceBase extends TableCellCustom<APIResource<IApp>> {

  multipleConnectedEndpoints$: Observable<boolean>;

  constructor(store: Store<AppState>) {
    super();
    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(store);
  }


}
