import { Action } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { ListView, ListPagination, ListSort, ListFilter } from '../../store/actions/list.actions';
import { ListState } from '../../store/reducers/list.reducer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export interface AppEvent {
  actee_name: string;
  actee_type: string;
  actor: string;
  actor_name: string;
  actor_type: string;
  actor_username: string;
  metadata: Object;
  organization_guid: string;
  space_guid: string;
  timestamp: string;
  type: string;
}

export class ListActionConfig<T> {
  createAction: (dataSource: IListDataSource<T>, items: T[]) => Action;
  icon: string;
  label: string;
  description: string;
  visible: (row: T) => boolean;
  enabled: (row: T) => boolean;
}
export class ListActions<T> {
  globalActions = new Array<ListActionConfig<T>>();
  multiActions = new Array<ListActionConfig<T>>();
  singleActions = new Array<ListActionConfig<T>>();
}
export interface IListDataSource<T> {
  listStateKey: string;
  view$: Observable<ListView>;
  state$: Observable<ListState>;
  pagination$: Observable<ListPagination>;
  sort$: Observable<ListSort>;
  filter$: Observable<ListFilter>;

  actions: ListActions<T>;

  page$: Observable<T[]>;

  addItem: T;
  isAdding$: BehaviorSubject<boolean>;
  isSelecting$: BehaviorSubject<boolean>;

  editRow: T; // Edit items - remove once ng-content can exist in md-table

  selectAllChecked: boolean; // Select items - remove once ng-content can exist in md-table
  selectedRows: Map<string, T>; // Select items - remove once ng-content can exist in md-table
  selectAllFilteredRows(); // Select items - remove once ng-content can exist in md-table
  selectedRowToggle(row: T); // Select items - remove once ng-content can exist in md-table
  selectClear();

  startEdit(row: T); // Edit items - remove once ng-content can exist in md-table
  saveEdit(); // Edit items - remove once ng-content can exist in md-table
  cancelEdit(); // Edit items - remove once ng-content can exist in md-table

  connect(): Observable<T[]>;
  destroy();
}

export type getRowUniqueId = (T) => string;
