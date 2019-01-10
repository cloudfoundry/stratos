import { BehaviorSubject, combineLatest, Observable, of as observableOf } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { ListView } from '../../../store/actions/list.actions';
import { defaultClientPaginationPageSize } from '../../../store/reducers/pagination-reducer/pagination.reducer';
import { ActionState } from './../../../store/reducers/api-request-reducer/types';
import { ListDataSource } from './data-sources-controllers/list-data-source';
import { IListDataSource } from './data-sources-controllers/list-data-source-types';
import { ITableColumn, ITableText } from './list-table/table.types';


export enum ListViewTypes {
  CARD_ONLY = 'cardOnly',
  TABLE_ONLY = 'tableOnly',
  BOTH = 'both'
}

export interface IListConfig<T> {
  /**
   * List of actions that are presented as individual buttons and applies to general activities surrounding the list (not specific to rows).
   * For example `Add`
   */
  getGlobalActions: () => IGlobalListAction<T>[];
  /**
   * List of actions that are presented as individual buttons when one or more rows are selected. For example `Delete` of selected rows.
   */
  getMultiActions: () => IMultiListAction<T>[];
  /**
   * List of actions that are presented in a mat-menu for an individual entity. For example `unmap` an application route
   */
  getSingleActions: () => IListAction<T>[];
  /**
   * Collection of column definitions to show when the list is in table mode
   */
  getColumns: () => ITableColumn<T>[];
  /**
   * The data source used to provide list entries. This will be custom per data type
   */
  getDataSource: () => IListDataSource<T>;
  /**
   * Collection of configuration objects to support multiple drops downs for filtering local lists. For example the application wall filters
   * by cloud foundry, organization and space. This mechanism supports only the showing and storing of such filters. An additional function
   * to the data sources transformEntities collection should be used to apply these custom settings to the data.
   */
  getMultiFiltersConfigs: () => IListMultiFilterConfig[];
  /**
   * Fetch an observable that will emit once the underlying config components have been created. For instance if the data source requires
   * something from the store which requires an async call
   */
  getInitialised?: () => Observable<boolean>;
  /**
   * A collection of numbers used to define how many entries per page should be shown. If missing a default will be used per table view type
   */
  pageSizeOptions?: number[];
  /**
   * What different views the user can select (table/cards)
   */
  viewType: ListViewTypes;
  /**
   * What is the initial view that the list will be displayed as (table/cards)
   */
  defaultView?: ListView;
  /**
   * Override the default list text
   */
  text?: ITableText;
  /**
   * Enable a few text filter... other config required
   */
  enableTextFilter?: boolean;
  /**
   * Fix the height of a table row
   */
  tableFixedRowHeight?: boolean;
  /**
   * Set the align-self of each cell in the row
   */
  tableRowAlignSelf?: string;
  /**
   * The card component used in card view
   */
  cardComponent?: any;
  hideRefresh?: boolean;
  /**
   * Allow selection regardless of number or visibility of multi actions
   */
  allowSelection?: boolean;
  /**
   * For metrics based data show a metrics range selector
   */
  showMetricsRange?: boolean;
}

export interface IListMultiFilterConfig {
  key: string;
  label: string;
  allLabel?: string;
  list$: Observable<IListMultiFilterConfigItem[]>;
  loading$: Observable<boolean>;
  select: BehaviorSubject<any>;
}

export interface IListMultiFilterConfigItem {
  label: string;
  item: any;
  value: string;
}

export const defaultPaginationPageSizeOptionsCards = [defaultClientPaginationPageSize, 30, 80];
export const defaultPaginationPageSizeOptionsTable = [5, 20, 80];

export class ListConfig<T> implements IListConfig<T> {
  isLocal = false;
  pageSizeOptions = defaultPaginationPageSizeOptionsCards;
  viewType = ListViewTypes.BOTH;
  text = null;
  enableTextFilter = false;
  cardComponent = null;
  defaultView = 'table' as ListView;
  allowSelection = false;
  getGlobalActions = (): IGlobalListAction<T>[] => null;
  getMultiActions = (): IMultiListAction<T>[] => null;
  getSingleActions = (): IListAction<T>[] => null;
  getColumns = (): ITableColumn<T>[] => null;
  getDataSource = (): ListDataSource<T> => null;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getInitialised = () => observableOf(true);
}

export interface IBaseListAction<T> {
  icon?: string;
  label: string;
  description?: string;
}

export interface IListAction<T> extends IBaseListAction<T> {
  action: (item: T) => void;
  createVisible?: (row$: Observable<T>) => Observable<boolean>;
  createEnabled?: (row$: Observable<T>) => Observable<boolean>;
}

export interface IOptionalAction<T> extends IBaseListAction<T> {
  visible$?: Observable<boolean>;
  enabled$?: Observable<boolean>;
}

export interface IMultiListAction<T> extends IOptionalAction<T> {
  /**
   * Return true if the selection should be cleared
   *
   * @memberof IMultiListAction
   */
  action: (items: T[]) => boolean | Observable<ActionState>;
}

export interface IGlobalListAction<T> extends IOptionalAction<T> {
  action: () => void;
}

export class MultiFilterManager<T> {
  public filterIsReady$: Observable<boolean>;
  public filterItems$: Observable<IListMultiFilterConfigItem[]>;
  public hasItems$: Observable<boolean>;
  public hasOneItem$: Observable<boolean>;
  public value: string;

  public filterKey: string;
  public allLabel: string;

  constructor(
    public multiFilterConfig: IListMultiFilterConfig,
    dataSource: IListDataSource<T>,
  ) {
    this.filterKey = this.multiFilterConfig.key;
    this.allLabel = multiFilterConfig.allLabel || 'All';
    this.filterItems$ = this.getItemObservable(multiFilterConfig);
    this.hasOneItem$ = this.filterItems$.pipe(map(items => items.length === 1));
    this.hasItems$ = this.filterItems$.pipe(map(items => !!items.length));
    this.filterIsReady$ = this.getReadyObservable(multiFilterConfig, dataSource, this.hasItems$);
  }

  private getReadyObservable(
    multiFilterConfig: IListMultiFilterConfig,
    dataSource: IListDataSource<T>,
    hasItems$: Observable<boolean>
  ) {
    return combineLatest(
      dataSource.isLoadingPage$,
      multiFilterConfig.loading$,
      hasItems$,
    ).pipe(
      map(([fetchingListPage, fetchingFilter, hasItems]) => (!fetchingListPage && !fetchingFilter) && hasItems),
      startWith(false)
    );
  }

  private getItemObservable(multiFilterConfig: IListMultiFilterConfig) {
    return multiFilterConfig.list$.pipe(
      map(list => list ? list : [])
    );
  }

  public applyValue(multiFilters: {}) {
    const value = multiFilters[this.multiFilterConfig.key];
    if (value) {
      this.value = value;
      this.selectItem(value);
    }
  }

  public selectItem(itemValue: string) {
    this.multiFilterConfig.select.next(itemValue);
    this.value = itemValue;
  }
}
