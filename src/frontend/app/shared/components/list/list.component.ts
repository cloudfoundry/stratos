import { animate, style, transition, trigger } from '@angular/animations';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  Optional,
  OnChanges,
  SimpleChanges,
  Injector,
} from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { MatPaginator, PageEvent, SortDirection } from '@angular/material';
import { Store } from '@ngrx/store';
import { schema as normalizrSchema } from 'normalizr';
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription,
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  first,
  map,
  pairwise,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { ListFilter, ListPagination, ListSort, SetListViewAction } from '../../../store/actions/list.actions';
import { AppState } from '../../../store/app-state';
import { entityFactory } from '../../../store/helpers/entity-factory';
import { getListStateObservables } from '../../../store/reducers/list.reducer';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { ListView } from './../../../store/actions/list.actions';
import { getDefaultRowState, IListDataSource, RowState } from './data-sources-controllers/list-data-source-types';
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
  IOptionalAction,
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
        style({ opacity: '0', transform: 'translateX(-2%)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateX(0)' })),
      ]),
      transition('* => right, * => repeatRight', [
        style({ opacity: '0', transform: 'translateX(2%)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateX(0)' })),
      ])
    ])
  ]
})
export class ListComponent<T> implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private uberSub: Subscription;

  @Input() addForm: NgForm;

  @Input() noEntries: TemplateRef<any>;

  @Input() noEntriesForCurrentFilter: TemplateRef<any>;

  // List config when supplied as an attribute rather than a dependency
  @Input() listConfig: ListConfig<T>;

  @ViewChild(MatPaginator) set setPaginator(paginator: MatPaginator) {
    if (!paginator) {
      return;
    }
    // The paginator component can do some smarts underneath (change page when page size changes). For non-local lists this means
    // multiple requests are made and stale data is added to the store. To prevent this only have one subscriber to the page change
    // event which handles either page or pageSize changes.
    this.paginationWidgetToStore = paginator.page.pipe(startWith(this.initialPageEvent)).pipe(
      pairwise(),
    ).subscribe(([oldV, newV]) => {
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
    });
  }

  @ViewChild('filter') set setFilter(filterValue: NgModel) {
    if (!filterValue) {
      return;
    }
    this.filterWidgetToStore = filterValue.valueChanges.pipe(
      debounceTime(this.dataSource.isLocal ? 150 : 250),
      distinctUntilChanged(),
      map(value => value as string),
      tap(filterString => {
        return this.paginationController.filterByString(filterString);
      })).subscribe();
  }

  private initialPageEvent: PageEvent;
  private paginatorSettings: {
    pageSizeOptions: number[],
    pageSize: Number,
    pageIndex: Number,
    length: Number
  } = {
      pageSizeOptions: null,
      pageSize: null,
      pageIndex: null,
      length: null
    };
  private headerSort: {
    direction: SortDirection,
    value: string;
  } = {
      direction: null,
      value: null
    };
  private filterString = '';
  private multiFilters = {};
  private sortColumns: ITableColumn<T>[];

  private paginationWidgetToStore: Subscription;
  private filterWidgetToStore: Subscription;

  globalActions: IGlobalListAction<T>[];
  multiActions: IMultiListAction<T>[];
  haveMultiActions = new BehaviorSubject(false);
  singleActions: IListAction<T>[];
  columns: ITableColumn<T>[];
  dataSource: IListDataSource<T>;
  multiFilterConfigs: IListMultiFilterConfig[];
  multiFilterConfigsLoading$: Observable<boolean>;

  paginationController: IListPaginationController<T>;
  multiFilterWidgetObservables = new Array<Subscription>();

  view$: Observable<ListView>;

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

  initialised$: Observable<boolean>;

  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  constructor(
    private store: Store<AppState>,
    private cd: ChangeDetectorRef,
    @Optional() public config: ListConfig<T>
  ) { }

  ngOnInit() {
    // null list means we have list bound but no value available yet
    if (this.listConfig === null) {
      // We will watch for changes to the list value
      return;
    } else if (this.listConfig) {
      // A value for the list is already available
      this.config = this.listConfig;
    }

    // Otherwise, do we have a value from the config?
    if (this.config) {
      if (this.config.getInitialised) {
        this.initialised$ = this.config.getInitialised().pipe(
          filter(initialised => initialised),
          first(),
          tap(() => this.initialise()),
          publishReplay(1), refCount()
        );
      } else {
        this.initialise();
        this.initialised$ = observableOf(true);
      }
    }
  }

  // If the list changes, update to use the new value
  ngOnChanges(changes: SimpleChanges) {
    const listChanges = changes.list;
    if (!!listChanges && listChanges.currentValue) {
      this.ngOnDestroy();
      // ngOnInit will pick up the new value and use it
      this.ngOnInit();
    }
  }

  private initialise() {
    this.globalActions = this.setupActionsDefaultObservables(
      this.config.getGlobalActions()
    );
    this.multiActions = this.setupActionsDefaultObservables(
      this.config.getMultiActions()
    );
    this.singleActions = this.config.getSingleActions();
    this.columns = this.config.getColumns();
    this.dataSource = this.config.getDataSource();
    if (this.dataSource.rowsState) {
      this.dataSource.getRowState = this.getRowStateFromRowsState;
    } else if (!this.dataSource.getRowState) {
      const schema = entityFactory(this.dataSource.entityKey);
      this.dataSource.getRowState = this.getRowStateGeneratorFromEntityMonitor(schema, this.dataSource);
    }
    this.multiFilterConfigs = this.config.getMultiFiltersConfigs();

    // Create convenience observables that make the html clearer
    this.isAddingOrSelecting$ = observableCombineLatest(
      this.dataSource.isAdding$,
      this.dataSource.isSelecting$
    ).pipe(
      map(([isAdding, isSelecting]) => isAdding || isSelecting)
    );
    // Set up an observable containing the current view (card/table)
    this.listViewKey = this.dataSource.entityKey + '-' + this.dataSource.paginationKey;
    const { view, } = getListStateObservables(this.store, this.listViewKey);
    this.view$ = view.pipe(
      map(listView => {
        if (this.config.viewType === ListViewTypes.CARD_ONLY) {
          return 'cards';
        }
        if (this.config.viewType === ListViewTypes.TABLE_ONLY) {
          return 'table';
        }
        return listView;
      })
    );

    // If this is the first time the user has used this list then set the view to the default
    this.view$.pipe(first()).subscribe(listView => {
      if (!listView) {
        this.updateListView(this.getDefaultListView(this.config));
      }
    });

    // Determine if this list view needs the control header bar at the top
    this.hasControls$ = this.view$.pipe(map((viewType) => {
      return !!(
        this.config.viewType === 'both' ||
        this.config.text && this.config.text.title ||
        this.addForm ||
        this.globalActions && this.globalActions.length ||
        this.multiActions && this.multiActions.length ||
        viewType === 'cards' && this.sortColumns && this.sortColumns.length ||
        this.multiFilterConfigs && this.multiFilterConfigs.length ||
        this.config.enableTextFilter
      );
    }));

    this.paginationController = new ListPaginationController(this.store, this.dataSource);

    this.hasRows$ = this.dataSource.page$.pipe(
      map(pag => !!(pag && pag.length)),
      startWith(false)
    );

    // Determine if we should hide the paginator
    this.hidePaginator$ = observableCombineLatest(this.hasRows$, this.dataSource.pagination$).pipe(
      map(([hasRows, pagination]) => {
        const minPageSize = (
          this.paginatorSettings.pageSizeOptions && this.paginatorSettings.pageSizeOptions.length ?
            this.paginatorSettings.pageSizeOptions[0] : -1
        );
        return !hasRows ||
          pagination && (pagination.totalResults <= minPageSize);
      }));


    this.paginatorSettings.pageSizeOptions = this.config.pageSizeOptions ||
      (this.config.viewType === ListViewTypes.TABLE_ONLY ? defaultPaginationPageSizeOptionsTable : defaultPaginationPageSizeOptionsCards);

    // Ensure we set a pageSize that's relevant to the configured set of page sizes. The default is 9 and in some cases is not a valid
    // pageSize
    this.paginationController.pagination$.pipe(first()).subscribe(pagination => {
      this.initialPageEvent = new PageEvent;
      this.initialPageEvent.pageIndex = pagination.pageIndex - 1;
      this.initialPageEvent.pageSize = pagination.pageSize;
      if (this.paginatorSettings.pageSizeOptions.findIndex(pageSize => pageSize === pagination.pageSize) < 0) {
        this.initialPageEvent.pageSize = this.paginatorSettings.pageSizeOptions[0];
        this.paginationController.pageSize(this.paginatorSettings.pageSizeOptions[0]);
      }
    });

    const paginationStoreToWidget = this.paginationController.pagination$.pipe(tap((pagination: ListPagination) => {
      this.paginatorSettings.length = pagination.totalResults;
      this.paginatorSettings.pageIndex = pagination.pageIndex - 1;
      this.paginatorSettings.pageSize = pagination.pageSize;
    }));

    this.sortColumns = this.columns.filter((column: ITableColumn<T>) => {
      return column.sort;
    });

    const sortStoreToWidget = this.paginationController.sort$.pipe(tap((sort: ListSort) => {
      this.headerSort.value = sort.field;
      this.headerSort.direction = sort.direction;
    }));

    const filterStoreToWidget = this.paginationController.filter$.pipe(tap((paginationFilter: ListFilter) => {
      this.filterString = paginationFilter.string;
      this.multiFilters = { ...paginationFilter.items };
    }));

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
          const sub = filterConfig.select.asObservable().pipe(tap((filterItem: string) => {
            this.paginationController.multiFilter(filterConfig, filterItem);
          }));
          this.multiFilterWidgetObservables.push(sub.subscribe());
          multiFiltersLoading.push(filterConfig.loading$);
        });
        this.multiFilterConfigsLoading$ = observableCombineLatest(multiFiltersLoading).pipe(
          map((isLoading: boolean[]) => !!isLoading.find(bool => bool))
        );
      })
    ).subscribe();

    this.isFiltering$ = this.paginationController.filter$.pipe(
      map((f: ListFilter) => {
        const isFilteringByString = f.string ? !!f.string.length : false;
        const isFilteringByItems = Object.values(f.items).filter(value => !!value).length > 0;
        return isFilteringByString || isFilteringByItems;
      })
    );

    this.noRowsHaveFilter$ = observableCombineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => {
        return !hasRows && isFiltering;
      })
    );
    this.noRowsNotFiltering$ = observableCombineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => {
        return !hasRows && !isFiltering;
      })
    );

    this.hasRowsOrIsFiltering$ = observableCombineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => {
        return hasRows || isFiltering;
      })
    );

    this.disableActions$ = observableCombineLatest(this.dataSource.isLoadingPage$, this.noRowsHaveFilter$).pipe(
      map(([isLoading, noRowsHaveFilter]) => {
        return isLoading || noRowsHaveFilter;
      })
    );

    // Multi actions can be a list of actions that aren't visible. For those case, in effect, we don't have multi actions
    const visibles$ = (this.multiActions || []).map(multiAction => multiAction.visible$);
    const haveMultiActions = observableCombineLatest(visibles$).pipe(
      map(visibles => visibles.some(visible => visible)),
      tap(allowSelection => {
        this.haveMultiActions.next(allowSelection);
      })
    );

    this.uberSub = observableCombineLatest(
      paginationStoreToWidget,
      filterStoreToWidget,
      sortStoreToWidget,
      haveMultiActions
    ).subscribe();

    this.pageState$ = observableCombineLatest(
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

    const canShowLoading$ = this.dataSource.isLoadingPage$.pipe(
      distinctUntilChanged((previousVal, newVal) => !previousVal && newVal),
      switchMap(() => this.dataSource.pagination$),
      map(pag => pag.currentPage),
      pairwise(),
      map(([oldPage, newPage]) => oldPage !== newPage),
      startWith(true)
    );

    this.showProgressBar$ = this.dataSource.isLoadingPage$.pipe(
      startWith(true),
      withLatestFrom(canShowLoading$),
      map(([loading, canShowLoading]) => {
        return canShowLoading && loading;
      }),
      distinctUntilChanged()
    );

    this.isRefreshing$ = this.dataSource.isLoadingPage$.pipe(
      withLatestFrom(canShowLoading$),
      map(([loading, canShowLoading]) => {
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
    if (this.paginationWidgetToStore) {
      this.paginationWidgetToStore.unsubscribe();
    }
    if (this.filterWidgetToStore) {
      this.filterWidgetToStore.unsubscribe();
    }
    if (this.uberSub) {
      this.uberSub.unsubscribe();
    }
    if (this.dataSource) {
      this.dataSource.destroy();
    }
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
    this.headerSort.value = field;
    this.headerSort.direction = direction;
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
            this.paginationController.page(0);
          }
        }),
        takeWhile(isLoading => isLoading)
      ).subscribe();
    }
  }

  private setupActionsDefaultObservables<Y extends IOptionalAction<T>>(actions: Y[]) {
    if (Array.isArray(actions)) {
      return actions.map(action => {
        if (!action.visible$) {
          action.visible$ = observableOf(true);
        }
        if (!action.enabled$) {
          action.enabled$ = observableOf(true);
        }
        return action;
      });
    }
    return actions;
  }

  private getRowStateGeneratorFromEntityMonitor(entitySchema: normalizrSchema.Entity, dataSource: IListDataSource<T>) {
    return (row) => {
      if (!entitySchema || !row) {
        return observableOf(getDefaultRowState());
      }
      const entityMonitor = new EntityMonitor(this.store, dataSource.getRowUniqueId(row), dataSource.entityKey, entitySchema);
      return entityMonitor.entityRequest$.pipe(
        distinctUntilChanged(),
        map(requestInfo => ({
          deleting: requestInfo.deleting.busy,
          error: requestInfo.deleting.error,
          message: requestInfo.deleting.error ? `Sorry, deletion failed` : null
        }))
      );
    };
  }

  private getRowStateFromRowsState = (row: T): Observable<RowState> =>
    this.dataSource.rowsState.pipe(map(state => state[this.dataSource.getRowUniqueId(row)] || getDefaultRowState()))

}
