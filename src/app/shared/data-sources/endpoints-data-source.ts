import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operator/filter';
import { Observable } from 'rxjs/Rx';

import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { AppState } from '../../store/app-state';
import { cnsisEntitiesSelector, cnsisStatusSelector } from '../../store/selectors/cnsis.selectors';
import { CNSISModel } from '../../store/types/cnsis.types';
import { ListDataSource } from './list-data-source';
import { EndpointSchema, GetAllCNSIS } from '../../store/actions/cnsis.actions';


export class EndpointsDataSource extends ListDataSource<CNSISModel> {

  isLoadingPage$: Observable<boolean>;
  data$: any;

  constructor(
    private _eStore: Store<AppState>,
  ) {
    super(
      _eStore,
      new GetAllCNSIS(),
      EndpointSchema,
      (object: CNSISModel) => {
        return object.guid;
      },
      () => ({
        name: ''
      }),
      GetAllCNSIS.storeKey,
      null,
      true, // isLocal
      [
        {
          type: 'filter',
          field: 'name'
        },
        {
          type: 'sort',
          orderKey: 'name',
          field: 'name'
        },
        {
          type: 'sort',
          orderKey: 'connection',
          field: 'info.user'
        },
        {
          type: 'sort',
          orderKey: 'type',
          field: 'cnsi_type'
        },
        {
          type: 'sort',
          orderKey: 'address',
          field: 'api_endpoint.Host'
        },
      ]
    );

    _eStore.dispatch(new SetListStateAction(
      GetAllCNSIS.storeKey,
      'table',
    ));

  }

  connect(): Observable<CNSISModel[]> {
    this.isLoadingPage$ = this.isLoadingPage$ || this._eStore.select(cnsisStatusSelector).map((cnsis => cnsis.loading));
    this.data$ = this.data$ || this._eStore.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis));
    return super.connect();
  }
}
