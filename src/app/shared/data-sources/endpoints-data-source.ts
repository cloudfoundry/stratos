import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { CNSISModel, CNSISState } from '../../store/types/cnsis.types';
import { ListFilter, ListSort, SetListStateAction } from '../../store/actions/list.actions';
import { filter } from 'rxjs/operator/filter';
import { Observable } from 'rxjs/Rx';
import { LocalListDataSource } from './list-data-source-local';


export class EndpointsDataSource extends LocalListDataSource<CNSISModel> {
  private static _storeKey = 'endpoints';

  // Only needed for unique filter when adding new env vars
  private rowNames: Array<string> = new Array<string>();
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
      {
        name: ''
      },
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

  saveAdd() {
    // const updateApp = this._createUpdateApplication(false);
    // updateApp.environment_json[this.addItem.name] = this.addItem.value;
    // this._appService.UpdateApplicationEvVars(updateApp);

    // super.saveAdd();
  }

  selectedDelete() {
    // const updateApp = this._createUpdateApplication(true);
    // this._appService.UpdateApplicationEvVars(updateApp);

    // super.selectedDelete();
  }

  startEdit(row: CNSISModel) {
    // super.startEdit({ ...row });
  }

  saveEdit() {
    // const updateApp = this._createUpdateApplication(false);
    // updateApp.environment_json[this.editRow.name] = this.editRow.value;
    // this._appService.UpdateApplicationEvVars(updateApp);

    // super.saveEdit();
  }

  connect(): Observable<CNSISModel[]> {
    this.isLoadingPage$ = this._eStore.select('cnsis').map((cnsis: CNSISState) => cnsis.loading);
    this.data$ = this._eStore.select('cnsis').map((cnsis: CNSISState) => cnsis.entities);
    return super.connect();
  }

  destroy() {
    super.destroy();
  }

  listFilter(endpoints: CNSISModel[], filter: ListFilter): CNSISModel[] {
    this.filteredRows.length = 0;
    this.rows.length = 0;
    this.rowNames.length = 0;

    for (const endpoint of endpoints) {
      const { name } = endpoint;
      this.rows.push(endpoint);
      this.rowNames.push(name);

      if (filter && filter.filter && filter.filter.length > 0) {
        if (endpoint.name.indexOf(filter.filter) >= 0 ||
          endpoint.cnsi_type.indexOf(filter.filter) >= 0 ||
          endpoint.api_endpoint.Host.indexOf(filter.filter) >= 0) {
          // TODO: RC Connection  + type
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

  // _createUpdateApplication(removeSelected: boolean): UpdateApplication {
  //   const updateApp: UpdateApplication = {
  //     environment_json: {},
  //   };
  //   for (const row of this.rows) {
  //     if (!removeSelected || !this.selectedRows.has(row.name)) {
  //       updateApp.environment_json[row.name] = row.value;
  //     }
  //   }
  //   return updateApp;
  // }
}
