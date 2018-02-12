import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { MatPaginator, MatSelect, SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { ListFilter, ListPagination, ListSort, ListView, SetListViewAction } from '../../../store/actions/list.actions';
import { AppState } from '../../../store/app-state';
import { getListStateObservables } from '../../../store/reducers/list.reducer';
import { IListDataSource } from './data-sources-controllers/list-data-source-types';
import { IListPaginationController, ListPaginationController } from './data-sources-controllers/list-pagination-controller';
import { ITableColumn } from './list-table/table.types';
import {
  IGlobalListAction,
  IListAction,
  IListMultiFilterConfig,
  IMultiListAction,
  ListConfig,
} from './list.component.types';


@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})

export class ListComponent<T> implements OnInit, OnDestroy, AfterViewInit {
  private uberSub: Subscription;

  view$: Observable<ListView>;

  @Input('addForm') addForm: NgForm;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: NgModel;
  filterString = '';
  multiFilters = {};

  sortColumns: ITableColumn<T>[];
  @ViewChild('headerSortField') headerSortField: MatSelect;
  headerSortDirection: SortDirection = 'asc';
  headerSortDirectionChanged = new EventEmitter<SortDirection>();

  globalActions: IListAction<T>[];
  multiActions: IMultiListAction<T>[];
  singleActions: IListAction<T>[];
  columns: ITableColumn<T>[];
  dataSource: IListDataSource<T>;
  multiFilterConfigs: IListMultiFilterConfig[];

  paginationController: IListPaginationController<T>;
  multiFilterWidgetObservables = new Array<Subscription>();

  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(
    private store: Store<AppState>,
    private cd: ChangeDetectorRef,
    public config: ListConfig<T>
  ) { }

  ngOnInit() {
    this.globalActions = this.config.getGlobalActions();
    this.multiActions = this.config.getMultiActions();
    this.singleActions = this.config.getSingleActions();
    this.columns = this.config.getColumns();
    this.dataSource = this.config.getDataSource();
    this.multiFilterConfigs = this.config.getMultiFiltersConfigs();

    // Set up an observable containing the current view (card/table)
    const { view, } = getListStateObservables(this.store, this.dataSource.paginationKey);
    this.view$ = view;

    // If this is the first time the user has used this list then set the view to the default
    this.view$.first().subscribe(listView => {
      if (!listView) {
        this.updateListView(this.config.defaultView || 'table');
      }
    });

    this.paginationController = new ListPaginationController(this.store, this.dataSource);

    this.paginator.pageSizeOptions = this.config.pageSizeOptions;

    // Ensure we set a pageSize that's relevant to the configured set of page sizes. The default is 9 and in some cases is not a valid
    // pageSize
    this.paginationController.pagination$.first().subscribe(pagination => {
      if (this.paginator.pageSizeOptions.findIndex(pageSize => pageSize === pagination.pageSize) < 0) {
        this.paginationController.pageSize(this.paginator.pageSizeOptions[0]);
      }
    });

    const paginationStoreToWidget = this.paginationController.pagination$.do((pagination: ListPagination) => {
      this.paginator.length = pagination.totalResults;
      this.paginator.pageIndex = pagination.pageIndex - 1;
      this.paginator.pageSize = pagination.pageSize;
    });

    const paginationWidgetToStorePage = this.paginator.page
      .map(page => page.pageIndex)
      .do(pageIndex => this.paginationController.page(pageIndex));


    const paginationWidgetToStorePageSize = this.paginator.page
      .map(page => page.pageSize)
      .distinctUntilChanged()
      .do(pageSize => this.paginationController.pageSize(pageSize));

    const filterWidgetToStore = this.filter.valueChanges
      .debounceTime(this.dataSource.isLocal ? 150 : 250)
      .distinctUntilChanged()
      .map(value => value as string)
      .do(filterString => {
        return this.paginationController.filterByString(filterString);
      });

    this.multiFilterWidgetObservables = new Array<Subscription>();
    Object.values(this.multiFilterConfigs).forEach((filterConfig: IListMultiFilterConfig) => {
      const sub = filterConfig.select.asObservable().do((filterItem: string) => {
        this.paginationController.multiFilter(filterConfig, filterItem);
      });
      this.multiFilterWidgetObservables.push(sub.subscribe());
    });

    this.sortColumns = this.columns.filter((column: ITableColumn<T>) => {
      return column.sort;
    });

    const sortStoreToWidget = this.paginationController.sort$.do((sort: ListSort) => {
      this.headerSortField.value = sort.field;
      this.headerSortDirection = sort.direction;
    });

    const filterStoreToWidget = this.paginationController.filter$.do((filter: ListFilter) => {
      this.filterString = filter.string;
      this.multiFilters = filter.items;
    });

    this.uberSub = Observable.combineLatest(
      paginationStoreToWidget,
      paginationWidgetToStorePage,
      paginationWidgetToStorePageSize,
      filterStoreToWidget,
      filterWidgetToStore,
      sortStoreToWidget
    ).subscribe();

  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.multiFilterWidgetObservables.forEach(sub => sub.unsubscribe());
    this.uberSub.unsubscribe();
    this.dataSource.destroy();
  }

  updateListView(listView: ListView) {
    this.store.dispatch(new SetListViewAction(this.dataSource.paginationKey, listView));
  }

  updateListSort(field: string, direction: SortDirection) {
    this.headerSortField.value = field;
    this.headerSortDirection = direction;
    this.paginationController.sort({
      direction,
      field
    });
  }

  executeActionMultiple(listActionConfig: IMultiListAction<T>) {
    listActionConfig.action(Array.from(this.dataSource.selectedRows.values()));
    this.dataSource.selectClear();
  }

  executeActionGlobal(listActionConfig: IGlobalListAction<T>) {
    listActionConfig.action();
  }

}
