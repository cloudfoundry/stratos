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
  // TODO: RC REMOVE?
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

  destroy() {
    super.destroy();
  }

  // listFilter(endpoints: CNSISModel[], filter: ListFilter): CNSISModel[] {
  //   this.filteredRows.length = 0;
  //   this.rows.length = 0;

  //   for (const endpoint of endpoints) {
  //     const { name } = endpoint;
  //     this.rows.push(endpoint);

  //     if (filter && filter.filter && filter.filter.length > 0) {
  //       if (endpoint.name.indexOf(filter.filter) >= 0 ||
  //         endpoint.cnsi_type.indexOf(filter.filter) >= 0 ||
  //         (
  //           endpoint.api_endpoint &&
  //           endpoint.api_endpoint.Scheme.indexOf(filter.filter) >= 0 ||
  //           endpoint.api_endpoint.Host.indexOf(filter.filter) >= 0
  //         )
  //       ) {
  //         this.filteredRows.push(endpoint);
  //       }
  //     } else {
  //       this.filteredRows.push(endpoint);
  //     }
  //   }

  //   return this.filteredRows;
  // }

  // listSort(endpoints: Array<CNSISModel>, sort: ListSort): CNSISModel[] {
  //   return endpoints.slice().sort((a, b) => {
  //     const [propertyA, propertyB] = [a[sort.field], b[sort.field]];
  //     const valueA = isNaN(+propertyA) ? propertyA : +propertyA;
  //     const valueB = isNaN(+propertyB) ? propertyB : +propertyB;

  //     return (valueA < valueB ? -1 : 1) * (sort.direction === 'asc' ? 1 : -1);
  //   });
  // }
}
