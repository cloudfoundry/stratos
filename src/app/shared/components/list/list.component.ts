
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
  Injector,
} from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { MatPaginator, MatSelect, PageEvent, SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import {
  ListFilter,
  ListPagination,
  ListSort,
  ListView,
  SetListViewAction,
} from '../../../store/actions/list.actions';
import { AppState } from '../../../store/app-state';
import { IListDataSource } from '../../data-sources/list-data-source-types';
import { ITableColumn, ITableText } from '../table/table.types';
import { StaticInjector } from '@angular/core/src/di/injector';
import { ListDataSource } from '../../data-sources/list-data-source';
import { ListPaginationController, IListPaginationController } from '../../data-sources/list-pagination-controller';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';

export interface IListConfig<T> {
  getGlobalActions: () => IGlobalListAction<T>[];
  getMultiActions: () => IMultiListAction<T>[];
  getSingleActions: () => IListAction<T>[];
  getColumns: () => ITableColumn<T>[];
  getDataSource: () => IListDataSource<T>;
  getFiltersConfigs: () => IListFilterConfig[];
  isLocal?: boolean;
  pageSizeOptions: Number[];
}

export interface IListFilterConfig {
  key: string;
  label: string;
  items: IListFilterConfigItem[];
}

export interface IListFilterConfigItem {
  label: string;
  value: string;
}

export class ListConfig implements IListConfig<any> {
  isLocal = false;
  pageSizeOptions = [9, 45, 90];
  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => null;
  getDataSource = () => null;
  getFiltersConfigs = () => [];
}

export interface IBaseListAction<T> {
  icon: string;
  label: string;
  description: string;
  visible: (row: T) => boolean;
  enabled: (row: T) => boolean;
}

export interface IListAction<T> extends IBaseListAction<T> {
  action: (item: T) => void;
}

export interface IMultiListAction<T> extends IBaseListAction<T> {
  action: (items: T[]) => void;
}

export interface IGlobalListAction<T> extends IBaseListAction<T> {
  action: () => void;
}


@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})

export class ListComponent<T> implements OnInit, OnDestroy, AfterViewInit {
  private uberSub: Subscription;

  @Input('text') text = null as ITableText;
  @Input('enableFilter') enableFilter = false;
  @Input('tableFixedRowHeight') tableFixedRowHeight = false;
  @Input('cardComponent') cardComponent: Type<{}>;
  @Input('addForm') addForm: NgForm;


  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: NgModel;
  filterString = '';

  sortColumns: ITableColumn<T>[];
  @ViewChild('headerSortField') headerSortField: MatSelect;
  headerSortDirection: SortDirection = 'asc';
  headerSortDirectionChanged = new EventEmitter<SortDirection>();

  globalActions: IListAction<T>[];
  multiActions: IMultiListAction<T>[];
  singleActions: IListAction<T>[];
  columns: ITableColumn<T>[];
  dataSource: IListDataSource<T>;
  filterConfigs: IListFilterConfig[];

  paginationController: IListPaginationController<T>;

  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(
    private _store: Store<AppState>,
    private cd: ChangeDetectorRef,
    private listConfigService: ListConfig
  ) { }

  ngOnInit() {

    this.globalActions = this.listConfigService.getGlobalActions();
    this.multiActions = this.listConfigService.getMultiActions();
    this.singleActions = this.listConfigService.getSingleActions();
    this.columns = this.listConfigService.getColumns();
    this.dataSource = this.listConfigService.getDataSource();
    this.filterConfigs = this.listConfigService.getFiltersConfigs();

    this.paginationController = new ListPaginationController(this._store, this.dataSource);

    this.paginator.pageSizeOptions = this.listConfigService.pageSizeOptions;
    const paginationStoreToWidget = this.paginationController.pagination$.do((pagination: ListPagination) => {
      this.paginator.length = pagination.totalResults;
      this.paginator.pageIndex = pagination.pageIndex - 1;
      this.paginator.pageSize = pagination.pageSize;
    });

    const paginationWidgetToStorePage = this.paginator.page
      .map(page => page.pageIndex)
      .distinctUntilChanged()
      .do(pageIndex => this.paginationController.page(pageIndex));


    const paginationWidgetToStorePageSize = this.paginator.page
      // Ignore the initial case where it skips distinctUntilChanged (we should have gotten the widget values from the store to start with)
      .skip(1)
      .map(page => page.pageSize)
      .distinctUntilChanged()
      .do(pageSize => this.paginationController.pageSize(pageSize));

    const filterWidgetToStore = this.filter.valueChanges
      .debounceTime(500)
      .distinctUntilChanged()
      .map(value => value as string)
      .do(filterString => {
        return this.paginationController.filterByString(filterString);
      });

    this.sortColumns = this.columns.filter((column: ITableColumn<T>) => {
      return column.sort;
    });

    const sortStoreToWidget = this.paginationController.sort$.do((sort: ListSort) => {
      this.headerSortField.value = sort.field;
      this.headerSortDirection = sort.direction;
    });

    const filterStoreToWidget = this.paginationController.filter$.do((filter: ListFilter) => {
      this.filterString = filter.filter;
    });

    this.uberSub = Observable.combineLatest(
      this.dataSource.page$,
      paginationStoreToWidget,
      paginationWidgetToStorePage,
      paginationWidgetToStorePageSize,
      filterStoreToWidget,
      filterWidgetToStore,
      sortStoreToWidget,
    ).subscribe();

  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.uberSub.unsubscribe();
  }

  updateListView(listView: ListView) {
    this._store.dispatch(new SetListViewAction(this.dataSource.paginationKey, listView));
  }

  updateListSort(field: string, direction: SortDirection) {
    this.headerSortField.value = field;
    this.headerSortDirection = direction;
    this.paginationController.sort({
      direction,
      field
    });
  }

  updateFilters(filterItemKey: string, selectedValue: string) {
    console.log(`Filter Key: ${filterItemKey} Filter Value: ${selectedValue}`);
  }

  executeActionMultiple(listActionConfig: IMultiListAction<T>) {
    listActionConfig.action(Array.from(this.dataSource.selectedRows.values()));
    this.dataSource.selectClear();
  }

  executeActionGlobal(listActionConfig: IGlobalListAction<T>) {
    listActionConfig.action();
  }

}
