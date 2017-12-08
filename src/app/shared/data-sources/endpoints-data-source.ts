import { ConnectCnis } from '../../store/actions/cnsis.actions';
import { Store, Action } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { CNSISModel, CNSISState, cnsisStoreNames } from '../../store/types/cnsis.types';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { filter } from 'rxjs/operator/filter';
import { Observable } from 'rxjs/Rx';
import { LocalListDataSource } from './list-data-source-local';
import { RouterNav } from '../../store/actions/router.actions';
import { ListActionConfig, ListActions } from './list-data-source-types';
import { selectEntities } from '../../store/selectors/api.selectors';
import { cnsisEntitiesSelector, cnsisStatusSelector } from '../../store/selectors/cnsis.selectors';


export class EndpointsDataSource extends LocalListDataSource<CNSISModel> {
  private static _storeKey = 'endpoints';

  // Only needed for update purposes
  private rows = new Array<CNSISModel>();

  filteredRows = new Array<CNSISModel>();
  isLoadingPage$: Observable<boolean>;
  data$: any;

  constructor(
    private _eStore: Store<AppState>,
  ) {
    super(
      _eStore,
      (object: CNSISModel) => {
        return object.guid;
      },
      () => ({
        name: ''
      }),
      { active: 'name', direction: 'asc' },
      EndpointsDataSource._storeKey
    );

    _eStore.dispatch(new SetListStateAction(
      EndpointsDataSource._storeKey,
      'table',
      {
        pageIndex: 0,
        pageSize: 5,
        pageSizeOptions: [5, 10, 15],
        totalResults: 0,
      },
      {
        direction: 'asc',
        field: 'name'
      },
      {
        filter: ''
      }));

  }

  connect(): Observable<CNSISModel[]> {
    this.isLoadingPage$ = this.isLoadingPage$ || this._eStore.select(cnsisStatusSelector).map((cnsis => cnsis.loading));
    this.data$ = this.data$ || this._eStore.select(cnsisEntitiesSelector)
      .map(cnsis => Object.values(cnsis));
    return super.connect();
  }

  destroy() {
    super.destroy();
  }

  listFilter(endpoints: CNSISModel[], filter: ListFilter): CNSISModel[] {
    this.filteredRows.length = 0;
    this.rows.length = 0;

    for (const endpoint of endpoints) {
      const { name } = endpoint;
      this.rows.push(endpoint);

      if (filter && filter.filter && filter.filter.length > 0) {
        if (endpoint.name.indexOf(filter.filter) >= 0 ||
          endpoint.cnsi_type.indexOf(filter.filter) >= 0 ||
          (
            endpoint.api_endpoint &&
            endpoint.api_endpoint.Scheme.indexOf(filter.filter) >= 0 ||
            endpoint.api_endpoint.Host.indexOf(filter.filter) >= 0
          )
        ) {
          this.filteredRows.push(endpoint);
        }
      } else {
        this.filteredRows.push(endpoint);
      }
    }

    return this.filteredRows;
  }

  listSort(endpoints: Array<CNSISModel>, sort: ListSort): CNSISModel[] {
    return endpoints.slice().sort((a, b) => {
      const [propertyA, propertyB] = [a[sort.field], b[sort.field]];
      const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
      const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

      return (valueA < valueB ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
    });
  }
}
