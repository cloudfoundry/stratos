import { animate, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { MatPaginator, MatSelect, PageEvent, SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { distinctUntilChanged, filter, first, map, pairwise, startWith, tap, withLatestFrom, takeUntil, takeWhile } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ListFilter, ListPagination, ListSort, SetListViewAction } from '../../../store/actions/list.actions';
import { AppState } from '../../../store/app-state';
import { getListStateObservables } from '../../../store/reducers/list.reducer';
import { ListView } from './../../../store/actions/list.actions';
import { IListDataSource } from './data-sources-controllers/list-data-source-types';
import { IListPaginationController, ListPaginationController } from './data-sources-controllers/list-pagination-controller';
import { ITableColumn } from './list-table/table.types';
import {
  defaultPaginationPageSizeOptionsCards,
  defaultPaginationPageSizeOptionsTable,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IMultiListAction,
  ListConfig,
  ListViewTypes,
} from './list.component.types';


@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  animations: [
    trigger('list', [
      transition('* => in', [
        style({ opacity: '0', transform: 'translateY(-10px)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateY(0)' }))
      ]),
      transition('* => left, * => repeatLeft', [
        style({ opacity: '0', transform: 'translateX(-20px)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateX(0)' })),
      ]),
      transition('* => right, * => repeatRight', [
        style({ opacity: '0', transform: 'translateX(20px)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateX(0)' })),
      ])
    ])
  ]
})
export class ListComponent<T> implements OnInit, OnDestroy, AfterViewInit {
  private uberSub: Subscription;

  view$: Observable<ListView>;

  @Input('addForm') addForm: NgForm;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('filter') filter: NgModel;
  filterString = '';
  multiFilters = {};

  @Input()
  noEntries: TemplateRef<any>;

  @Input()
  noEntriesForCurrentFilter: TemplateRef<any>;

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
  multiFilterConfigsLoading$: Observable<boolean>;

  paginationController: IListPaginationController<T>;
  multiFilterWidgetObservables = new Array<Subscription>();

  isAddingOrSelecting$: Observable<boolean>;
  hasRows$: Observable<boolean>;
  noRowsHaveFilter$: Observable<boolean>;
  disableActions$: Observable<boolean>;
  hasRowsOrIsFiltering$: Observable<boolean>;
  isFiltering$: Observable<boolean>;
  noRowsNotFiltering$: Observable<boolean>;
  showProgressBar$: Observable<boolean>;
  isRefreshing$: Observable<boolean>;

  // Observable which allows you to determine if the paginator control should be hidden
  hidePaginator$: Observable<boolean>;
  listViewKey: string;
  // Observable which allows you to determine if the top control bar should be shown
  hasControls$: Observable<boolean>;

  pageState$: Observable<string>;


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

    // Create convenience observables that make the html clearer
    this.isAddingOrSelecting$ = combineLatest(
      this.dataSource.isAdding$,
      this.dataSource.isSelecting$
    ).pipe(
      map(([isAdding, isSelecting]) => isAdding || isSelecting)
    );
    // Set up an observable containing the current view (card/table)
    this.listViewKey = this.dataSource.entityKey + '-' + this.dataSource.paginationKey;
    const { view, } = getListStateObservables(this.store, this.listViewKey);
    this.view$ = view;

    // If this is the first time the user has used this list then set the view to the default
    this.view$.first().subscribe(listView => {
      if (!listView) {
        this.updateListView(this.getDefaultListView(this.config));
      }
    });

    // Determine if this list view needs the control header bar at the top
    this.hasControls$ = this.view$.map((viewType) => {
      return !!(
        this.config.viewType === 'both' ||
        this.config.text && this.config.text.title ||
        this.addForm ||
        this.globalActions && this.globalActions.length ||
        this.multiActions && this.multiActions.length ||
        viewType === 'cards' && this.sortColumns && this.sortColumns.length ||
        this.multiFilterConfigs && this.multiFilterConfigs.length ||
        this.config.enableTextFilter ||
        this.dataSource.refresh
      );
    });

    this.paginationController = new ListPaginationController(this.store, this.dataSource);

    this.hasRows$ = this.dataSource.page$.pipe(
      map(pag => !!(pag && pag.length)),
      startWith(false)
    );

    // Determine if we should hide the paginator
    this.hidePaginator$ = combineLatest(this.hasRows$, this.dataSource.pagination$)
      .map(([hasRows, pagination]) => {
        const minPageSize = (
          this.paginator.pageSizeOptions && this.paginator.pageSizeOptions.length ? this.paginator.pageSizeOptions[0] : -1
        );
        return !hasRows ||
          pagination && (pagination.totalResults <= minPageSize);
      });

    this.paginator.pageSizeOptions = this.config.pageSizeOptions ||
      (this.config.viewType === ListViewTypes.TABLE_ONLY ? defaultPaginationPageSizeOptionsTable : defaultPaginationPageSizeOptionsCards);

    let initialPageEvent: PageEvent;
    // Ensure we set a pageSize that's relevant to the configured set of page sizes. The default is 9 and in some cases is not a valid
    // pageSize
    this.paginationController.pagination$.first().subscribe(pagination => {
      initialPageEvent = new PageEvent;
      initialPageEvent.pageIndex = pagination.pageIndex - 1;
      initialPageEvent.pageSize = pagination.pageSize;
      if (this.paginator.pageSizeOptions.findIndex(pageSize => pageSize === pagination.pageSize) < 0) {
        initialPageEvent.pageSize = this.paginator.pageSizeOptions[0];
        this.paginationController.pageSize(this.paginator.pageSizeOptions[0]);
      }
    });

    const paginationStoreToWidget = this.paginationController.pagination$.do((pagination: ListPagination) => {
      this.paginator.length = pagination.totalResults;
      this.paginator.pageIndex = pagination.pageIndex - 1;
      this.paginator.pageSize = pagination.pageSize;
    });

    // The paginator component can do some smarts underneath (change page when page size changes). For non-local lists this means
    // multiple requests are made and stale data is added to the store. To prevent this only have one subscriber to the page change
    // event which handles either page or pageSize changes.
    const paginationWidgetToStore = this.paginator.page.startWith(initialPageEvent).pipe(
      pairwise(),
      tap(([oldV, newV]) => {
        const pageSizeChanged = oldV.pageSize !== newV.pageSize;
        const pageChanged = oldV.pageIndex !== newV.pageIndex;
        if (pageSizeChanged) {
          this.paginationController.pageSize(newV.pageSize);
          if (this.dataSource.isLocal) {
            this.paginationController.page(0);
          }
        } else if (pageChanged) {
          this.paginationController.page(newV.pageIndex);
        }
      })
    );

    const filterWidgetToStore = this.filter.valueChanges
      .debounceTime(this.dataSource.isLocal ? 150 : 250)
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
      this.filterString = filter.string;
      this.multiFilters = filter.items;
    });

    // Multi filters (e.g. cf/org/space)
    // - Ensure the initial value is correct
    // - Pass any multi filter changes made by the user to the pagination controller and thus the store
    this.multiFilterWidgetObservables = new Array<Subscription>();
    filterStoreToWidget.pipe(
      first(),
      tap(() => {
        const multiFiltersLoading = [];
        Object.values(this.multiFilterConfigs).forEach((filterConfig: IListMultiFilterConfig) => {
          filterConfig.select.next(this.multiFilters[filterConfig.key]);
          const sub = filterConfig.select.asObservable().do((filterItem: string) => {
            this.paginationController.multiFilter(filterConfig, filterItem);
          });
          this.multiFilterWidgetObservables.push(sub.subscribe());
          multiFiltersLoading.push(filterConfig.loading$);
        });
        this.multiFilterConfigsLoading$ = combineLatest(multiFiltersLoading).pipe(
          map((isLoading: boolean[]) => !!isLoading.find(bool => bool))
        );
      })
    ).subscribe();


    this.isFiltering$ = this.paginationController.filter$.pipe(
      map((filter: ListFilter) => {
        const isFilteringByString = filter.string ? !!filter.string.length : false;
        const isFilteringByItems = Object.values(filter.items).filter(value => !!value).length > 0;
        return isFilteringByString || isFilteringByItems;
      })
    );

    this.noRowsHaveFilter$ = combineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => {
        return !hasRows && isFiltering;
      })
    );
    this.noRowsNotFiltering$ = combineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => {
        return !hasRows && !isFiltering;
      })
    );

    this.hasRowsOrIsFiltering$ = combineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => {
        return hasRows || isFiltering;
      })
    );

    this.disableActions$ = combineLatest(this.dataSource.isLoadingPage$, this.noRowsHaveFilter$).pipe(
      map(([isLoading, noRowsHaveFilter]) => {
        return isLoading || noRowsHaveFilter;
      })
    );

    this.uberSub = Observable.combineLatest(
      paginationStoreToWidget,
      paginationWidgetToStore,
      filterStoreToWidget,
      filterWidgetToStore,
      sortStoreToWidget
    ).subscribe();

    this.pageState$ = combineLatest(
      this.paginationController.pagination$,
      this.dataSource.isLoadingPage$,
      this.view$
    )
      .pipe(
        filter(([pagination, busy, viewType]) => viewType !== 'table'),
        map(([pagination, busy, viewType]) => ({ pageIndex: pagination.pageIndex, busy, viewType })),
        distinctUntilChanged((x, y) => x.pageIndex === y.pageIndex && x.busy === y.busy && x.viewType === y.viewType),
        pairwise(),
        map(([oldVal, newVal]) => {

          if (oldVal.viewType !== oldVal.viewType) {
            return 'none';
          }
          if (oldVal.pageIndex > newVal.pageIndex) {
            return 'left';
          } else if (oldVal.pageIndex < newVal.pageIndex) {
            return 'right';
          } else if (oldVal.busy && !newVal.busy) {
            return 'in';
          }
          return 'none';
        }),
        startWith('none'),
        pairwise(),
        map(([oldVal, newVal]) => {
          if (oldVal === newVal) {
            if (oldVal === 'left') {
              return 'repeatLeft';
            }
            if (oldVal === 'right') {
              return 'repeatRight';
            }
          }
          return newVal;
        })
      );

    const canShowLoading$ = this.dataSource.pagination$.pipe(
      map(pag => pag.currentPage),
      pairwise(),
      map(([oldPage, newPage]) => oldPage !== newPage),
      startWith(true)
    );

    this.showProgressBar$ = this.dataSource.isLoadingPage$.pipe(
      startWith(true),
      withLatestFrom(canShowLoading$),
      map(([loading, canShowLoading]) => {
        console.log(canShowLoading);
        return canShowLoading && loading;
      }),
      distinctUntilChanged()
    );

    this.isRefreshing$ = this.dataSource.isLoadingPage$.pipe(
      withLatestFrom(canShowLoading$),
      map(([loading, canShowLoading]) => {
        console.log(canShowLoading);
        return !canShowLoading && loading;
      }),
      distinctUntilChanged()
    );
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.multiFilterWidgetObservables.forEach(sub => sub.unsubscribe());
    this.uberSub.unsubscribe();
    this.dataSource.destroy();
  }

  private getDefaultListView(config: IListConfig<T>) {
    switch (config.viewType) {
      case ListViewTypes.TABLE_ONLY:
        return 'table';
      case ListViewTypes.CARD_ONLY:
        return 'cards';
      default:
        return this.config.defaultView || 'table';
    }
  }

  updateListView(listView: ListView) {
    this.store.dispatch(new SetListViewAction(this.listViewKey, listView));
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
    if (listActionConfig.action(Array.from(this.dataSource.selectedRows.values()))) {
      this.dataSource.selectClear();
    }
  }

  executeActionGlobal(listActionConfig: IGlobalListAction<T>) {
    listActionConfig.action();
  }

  public refresh() {
    if (this.dataSource.refresh) {
      this.dataSource.refresh();
      this.dataSource.isLoadingPage$.pipe(
        tap(isLoading => {
          if (!isLoading) {
            this.paginator.firstPage();
          }
        }),
        takeWhile(isLoading => isLoading)
      ).subscribe();
    }
  }
}
