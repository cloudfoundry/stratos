import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { EndpointSchema, GetAllCNSIS } from '../../store/actions/cnsis.actions';
import { SetListStateAction } from '../../store/actions/list.actions';
import { AppState } from '../../store/app-state';
import { cnsisEntitiesSelector, cnsisStatusSelector } from '../../store/selectors/cnsis.selectors';
import { CNSISModel } from '../../store/types/cnsis.types';
import { ListDataSource } from './list-data-source';


export class EndpointsDataSource extends ListDataSource<CNSISModel> {

  isLoadingPage$: Observable<boolean>;
  data$: any;
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
  ) {
    let bool = true;
    const action = new GetAllCNSIS();
    const paginationKey = GetAllCNSIS.storeKey;
    super({
      store,
      action,
      schema: EndpointSchema,
      getRowUniqueId: object => object.guid,
      getEmptyType: () => ({
        name: ''
      }),
      paginationKey,
      isLocal: true,
      entityFunctions: [
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
      ],
      rowsState: Observable.interval(1000).map(() => {
        return {
          '2fa75a76-c2e6-490f-acac-02eabb1bbf6a': {
            busy: !bool,
            error: bool,
            message: '<a href="#">Lorem ipsum dolor</a> sit amet, consectetur adipiscing elit. Nulla malesuada ullamcorper massa eu euismod. Aenean vel varius nunc, id blandit erat. Sed congue id velit et molestie.Vivamus nec quam eros. Nullam consectetur nisl non justo rutrum, sit amet interdum nibh imperdiet. Suspendisse eu fermentum enim.',
            blocked: bool
          },
          '6dd897cb-2e93-422d-b707-15ce24e76bdb': {
            busy: bool,
            error: !bool,
            message: 'Me too',
            blocked: bool
          }
        };
      })
        .do(() => bool = !bool)
    });
    this.store = store;
    store.dispatch(new SetListStateAction(
      paginationKey,
      'table',
    ));

  }

  connect(): Observable<CNSISModel[]> {
    this.isLoadingPage$ = this.isLoadingPage$ || this.store.select(cnsisStatusSelector).map((cnsis => cnsis.loading));
    this.data$ = this.data$ || this.store.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis));
    return super.connect();
  }
}
