import { animate, style, transition, trigger } from '@angular/animations';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Injector,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  signal,
 } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { MatPaginator, PageEvent } from '../../../shared/services/tailwind-material-replacements';
import { PageSizeSessionService } from '../../../shared/services/page-size-session.service';
export type SortDirection = 'asc' | 'desc' | '';
import { Store } from '@ngrx/store';
import {
  SetClientFilterKey,
  SetPage,
  entityCatalog,
  getListStateObservables,
  GeneralAppState,
  ListFilter,
  ListPagination,
  ListSort,
  ListView,
  SetListViewAction,
  EntityCatalogEntityConfig,
  ActionState,
  ResetPagination,
  ResetPaginationSortFilter,
  PaginatedAction,
  defaultClientPaginationPageSize,
  SetClientPageSize,
} from '@stratosui/store';
import {
  asapScheduler,
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  isObservable,
  Observable,
  of as observableOf,
  Subscription,
} from 'rxjs';
import { take,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  publishReplay,
  refCount,
  startWith,
  subscribeOn,
  takeWhile,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { StratosBrandingService } from '../../../../../theme/stratos-branding.service';
import { safeUnsubscribe } from '../../../core/utils.service';
import {
  EntitySelectConfig,
  getDefaultRowState,
  IListDataSource,
  RowState,
} from './data-sources-controllers/list-data-source-types';
import { IListPaginationController, ListPaginationController } from './data-sources-controllers/list-pagination-controller';
import { ITableColumn } from './list-table/table.types';
import {
  defaultPaginationPageSizeOptionsCards,
  defaultPaginationPageSizeOptionsTable,
  isPageSizeSentinel,
  resolvePageSize,
  IGlobalListAction,
  IListConfig,
  IListFilter,
  IListMultiFilterConfigItem,
  IMultiListAction,
  IOptionalAction,
  ListConfig,
  ListViewTypes,
  MultiFilterManager,
} from './list.component.types';
import { CardsComponent } from './list-cards/cards.component';
import { TableComponent } from './list-table/table.component';
import { PollingIndicatorComponent } from '../polling-indicator/polling-indicator.component';
import { MetricsRangeSelectorComponent } from '../metrics-range-selector/metrics-range-selector.component';
import { MaxListMessageComponent } from './max-list-message/max-list-message.component';
import { AppPaginatorComponent } from '../app-paginator/app-paginator.component';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    FormsModule,
    CardsComponent,
    forwardRef(() => TableComponent),
    PollingIndicatorComponent,
    MetricsRangeSelectorComponent,
    MaxListMessageComponent,
    AppPaginatorComponent,
  ],
  animations: [
    trigger('list', [
      transition('* => in', [
        style({ opacity: '0', transform: 'translateY(-10px)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateY(0)' }))
      ]),
      transition('* => left, * => repeatLeft', [
        style({ opacity: '0', transform: 'translateX(-2%)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateX(0)' }))
      ]),
      transition('* => right, * => repeatRight', [
        style({ opacity: '0', transform: 'translateX(2%)' }),
        animate('350ms ease-out', style({ opacity: '1', transform: 'translateX(0)' }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent<T> implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private uberSub!: Subscription;
  public entitySelectConfig!: EntitySelectConfig;

  @Input() addForm: NgForm;

  @Input() customFilters: TemplateRef<any>;

  @Input() noEntries: TemplateRef<any>;

  @Input() noEntriesForCurrentFilter: TemplateRef<any>;

  // List config when supplied as an attribute rather than a dependency
  @Input() listConfig: ListConfig<T>;

  private entitySelectValue = signal<number | undefined>(undefined);
  private entitySelectValueSubject = new BehaviorSubject<number | undefined>(undefined);
  entitySelectValue$ = this.entitySelectValueSubject.asObservable();

  pPaginator: MatPaginator;
  private filterString!: string;

  @ViewChild(MatPaginator) set setPaginator(paginator: MatPaginator) {
    if (!paginator || this.paginationWidgetToStore) {
      return;
    }

    this.pPaginator = paginator;
    // The paginator component can do some smarts underneath (change page when page size changes). For non-local lists this means
    // multiple requests are made and stale data is added to the store. To prevent this only have one subscriber to the page change
    // event which handles either page or pageSize changes.
    this.paginationWidgetToStore = paginator.page.pipe(
      startWith(this.initialPageEvent),
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
    if (!filterValue || this.filterWidgetToStore) {
      return;
    }
    this.filterWidgetToStore = filterValue.valueChanges.pipe(
      debounceTime(this.dataSource.isLocal ? 150 : 250),
      distinctUntilChanged(),
      map(value => value as string),
      tap(filterString => {
        return this.paginationController.filterByString(filterString);
      })
    ).subscribe();
  }

  @Output() initialised = new EventEmitter<boolean>();
  private componentInitialised = false;

  private initialPageEvent: PageEvent;
  private paginatorSettings: {
    pageSizeOptions: number[],
    pageSize: number,
    pageIndex: number,
    length: number;
  } = {
      pageSizeOptions: [],
      pageSize: defaultClientPaginationPageSize,
      pageIndex: 0,
      length: 0
    };
  private headerSort: {
    direction: SortDirection,
    value: string;
  } = {
      direction: null,
      value: null
    };
  sortColumns: ITableColumn<T>[] = [];
  filterColumns: IListFilter[] = [];
  private filterSelected: IListFilter;

  private paginationWidgetToStore!: Subscription;
  private filterWidgetToStore!: Subscription;
  private multiFilterChangesSub!: Subscription;

  globalActions!: IGlobalListAction<T>[];
  multiActions!: IMultiListAction<T>[];
  private haveMultiActionsSignal = signal<boolean>(false);
  private haveMultiActionsSubject = new BehaviorSubject<boolean>(false);
  haveMultiActions = this.haveMultiActionsSubject.asObservable();
  hasSingleActions!: boolean;
  columns!: ITableColumn<T>[];
  dataSource!: IListDataSource<T>;
  multiFilterManagers: MultiFilterManager<T>[];

  paginationController!: IListPaginationController<T>;
  private multiFilterWidgetObservables = new Array<Subscription>();

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

  pendingActions: Map<Observable<ActionState>, Subscription> = new Map<Observable<ActionState>, Subscription>();

  subs: Subscription[] = [];

  public safeAddForm() {
    // Something strange is afoot. When using addform in [disabled] it thinks this is null, even when initialised
    // When applying the question mark (addForm?) it's value is ignored by [disabled]
    return this.addForm || {};
  }

  private store = inject(Store<GeneralAppState>);
  private pageSizeSession = inject(PageSizeSessionService);
  private currentView: string = 'cards';
  private cd = inject(ChangeDetectorRef);
  private elRef = inject(ElementRef);
  public config = inject(ListConfig<T>, { optional: true });
  private ngZone = inject(NgZone);
  private injector = inject(Injector);
  private branding = inject(StratosBrandingService);

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
          take(1),
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

  private getMultiFilterManagers() {
    const configs = this.config?.getMultiFiltersConfigs();
    if (!configs) {
      return null;
    }
    return configs.map(config => new MultiFilterManager<T>(config, this.dataSource));
  }

  // TODO: This needs tidying up - NJ
  private initialise() {
    this.globalActions = this.setupActionsDefaultObservables(
      this.config?.getGlobalActions() ?? []
    );
    this.multiActions = this.setupActionsDefaultObservables(
      this.config?.getMultiActions() ?? []
    );
    this.hasSingleActions = (this.config?.getSingleActions() || []).length > 0;
    this.columns = this.config?.getColumns();
    this.dataSource = this.config?.getDataSource();
    this.entitySelectConfig = this.dataSource.entitySelectConfig;

    this.dataSource.pagination$.pipe(
      take(1),
    ).subscribe(pag => {
      this.entitySelectValue.set(pag.forcedLocalPage);
      this.entitySelectValueSubject.next(pag.forcedLocalPage);
    });


    if (this.dataSource.rowsState) {
      this.dataSource.getRowState = this.getRowStateFromRowsState;
    } else if (!this.dataSource.getRowState) {
      this.dataSource.getRowState = this.getRowStateGeneratorFromEntityMonitor(this.dataSource.sourceScheme, this.dataSource);
    }
    this.multiFilterManagers = this.getMultiFilterManagers();

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
        if (this.config?.viewType === ListViewTypes.CARD_ONLY) {
          return 'cards';
        }
        if (this.config?.viewType === ListViewTypes.TABLE_ONLY) {
          return 'table';
        }
        return listView;
      })
    );

    // If this is the first time the user has used this list then set the view to the default
    this.view$.pipe(take(1)).subscribe(listView => {
      if (!listView) {
        this.updateListView(this.getDefaultListView(this.config));
      }
    });

    // Determine if this list view needs the control header bar at the top
    this.hasControls$ = this.view$.pipe(map((viewType) => {
      return !!(
        this.config?.viewType === 'both' ||
        this.config?.text && this.config?.text.title ||
        this.addForm ||
        this.globalActions && this.globalActions.length ||
        this.multiActions && this.multiActions.length ||
        viewType === 'cards' && this.sortColumns && this.sortColumns.length ||
        this.multiFilterManagers && this.multiFilterManagers.length ||
        this.config?.enableTextFilter
      );
    }));

    this.paginationController = new ListPaginationController(this.store, this.dataSource, this.ngZone);
    this.multiFilterChangesSub = this.paginationController.multiFilterChanges$.subscribe();

    const hasPages$ = this.dataSource.page$.pipe(
      map(pag => !!(pag && pag.length)),
      distinctUntilChanged()
    );

    this.hasRows$ = observableCombineLatest(hasPages$, this.dataSource.maxedResults$).pipe(
      map(([hasPages, maxedResults]) => !maxedResults && hasPages),
      startWith(false)
    );

    // Show paginator when there are visible rows and results exceed the smallest
    // page size. For non-maxed lists this restores the original hide-when-small
    // behavior. For maxed lists (e.g. CF tab pages with client-side pagination)
    // the paginator is always shown so the user can control page size.
    this.hidePaginator$ = observableCombineLatest(
      hasPages$, this.dataSource.maxedResults$, this.paginationController.pagination$
    ).pipe(
      map(([hasPages, maxedResults, pagination]) => {
        if (!hasPages) {
          return true; // no data, hide
        }
        if (maxedResults) {
          return false; // maxed list with data, always show paginator
        }
        // Non-maxed: hide when total fits in smallest page size
        const minPageSize = (
          this.paginatorSettings.pageSizeOptions && this.paginatorSettings.pageSizeOptions.length ?
            this.paginatorSettings.pageSizeOptions[0] : -1
        );
        return pagination && (pagination.totalResults <= minPageSize);
      })
    );


    // Set page size options based on current view type.
    // If the config has a custom override (not the default cards/table arrays),
    // use it as-is. Otherwise, swap options when toggling between views.
    const hasCustomPageSizeOptions = this.config?.pageSizeOptions
      && this.config.pageSizeOptions !== defaultPaginationPageSizeOptionsCards
      && this.config.pageSizeOptions !== defaultPaginationPageSizeOptionsTable;

    if (hasCustomPageSizeOptions) {
      this.paginatorSettings.pageSizeOptions = this.config!.pageSizeOptions!;
    } else {
      this.view$.subscribe(view => {
        this.currentView = view;
        const newOptions = view === 'table'
          ? [...defaultPaginationPageSizeOptionsTable]
          : [...defaultPaginationPageSizeOptionsCards];
        this.paginatorSettings.pageSizeOptions = newOptions;

        // Restore the remembered size for this view, or use the
        // view's default if the current store value isn't valid.
        // Use hasExplicit + direct get to avoid cross-view fallback
        // (lastExplicit from a different view would pollute this one).
        const viewKey = `${this.dataSource.paginationKey}:${view}`;
        const remembered = this.pageSizeSession.hasExplicit(viewKey)
          ? this.pageSizeSession.get(viewKey)
          : undefined;
        const configDefault = this.branding.getDefaultPageSize();
        const targetSize = remembered !== undefined && newOptions.includes(remembered)
          ? remembered
          : newOptions.includes(configDefault) ? configDefault : newOptions[0];

        // Resolve sentinels (e.g., PAGE_SIZE_ALL = -1) to actual item count for the store.
        // The paginator select handles sentinel display via its own setter.
        const effectiveSize = resolvePageSize(targetSize, this.paginatorSettings.length);

        // Always force the page size to match the current view's options
        this.paginatorSettings.pageSize = targetSize;
        if (this.dataSource.isLocal) {
          this.store.dispatch(new SetClientPageSize(
            this.dataSource, this.dataSource.paginationKey, effectiveSize
          ));
          this.paginationController.page(0);
        } else {
          this.paginationController.pageSize(effectiveSize);
        }

        this.cd.markForCheck();
      });
    }

    // Set initial page size: session memory > config default > store value > first option.
    // Wait for both view$ (sets options) and pagination$ (gives current state).
    observableCombineLatest([
      this.view$.pipe(take(1)),
      this.paginationController.pagination$.pipe(take(1))
    ]).subscribe(([_view, pagination]) => {
      this.initialPageEvent = new PageEvent();
      this.initialPageEvent.pageIndex = pagination.pageIndex - 1;
      this.initialPageEvent.pageSize = pagination.pageSize;

      // Options are now set by the view$ subscription above
      const options = this.paginatorSettings.pageSizeOptions;
      const sessionSize = this.pageSizeSession.get(this.dataSource.paginationKey);
      let targetSize: number | undefined;

      if (sessionSize !== undefined && isPageSizeSentinel(sessionSize)) {
        targetSize = resolvePageSize(sessionSize, pagination.totalResults);
      } else if (sessionSize !== undefined && options.includes(sessionSize)) {
        targetSize = sessionSize;
      } else {
        // No stored session preference — try config default, then fall back
        const configDefault = this.branding.getDefaultPageSize();
        if (options.includes(configDefault)) {
          targetSize = configDefault;
        } else if (!options.includes(pagination.pageSize)) {
          targetSize = options[0];
        }
      }

      if (targetSize !== undefined) {
        this.initialPageEvent.pageSize = targetSize;
        setTimeout(() => this.paginationController.pageSize(targetSize!));
      }
    });

    const paginationStoreToWidget = this.paginationController.pagination$.pipe(tap((pagination: ListPagination) => {
      this.paginatorSettings.length = pagination.totalResults;
      this.paginatorSettings.pageIndex = pagination.pageIndex - 1;
      this.paginatorSettings.pageSize = pagination.pageSize;
      this.cd.markForCheck();
    }));

    this.sortColumns = (this.columns || []).filter((column: ITableColumn<T>) => {
      return column && column.sort;
    });

    const sortStoreToWidget = this.paginationController.sort$.pipe(tap((sort: ListSort) => {
      this.headerSort.value = sort.field;
      this.headerSort.direction = sort.direction;
    }));

    this.filterColumns = this.config?.getFilters ? this.config?.getFilters() : [];

    const filterStoreToWidget = this.paginationController.filter$.pipe(
      distinctUntilChanged(),
      tap((paginationFilter: ListFilter) => {
        this.filterString = paginationFilter.string;

        const filterKey = paginationFilter.filterKey;
        if (filterKey) {
          this.filterSelected = this.filterColumns.find(filterConfig => {
            return filterConfig.key === filterKey;
          });
        } else if (this.filterColumns) {
          this.filterSelected = this.filterColumns.find(filterConfig => filterConfig.default);
          if (this.filterSelected) {
            this.updateListFilter(this.filterSelected);
          }
        }

        // Pipe store values to filter managers. This ensures any changes such as automatically selected orgs/spaces are shown in the drop
        // downs (change org to one with one space results in that space being selected)
        Object.values(this.multiFilterManagers).forEach((filterManager: MultiFilterManager<T>, index: number) => {
          // If this is NOT the first... and we have the value to apply
          if (index !== 0 || filterManager.hasValue(paginationFilter.items)) {
            filterManager.applyValue(paginationFilter.items);
            return;
          }

          // If we're the first drop down filter and there are other drop downs... select the first one
          if (index === 0 && this.multiFilterManagers.length > 1) {
            filterManager.filterItems$.pipe(
              take(1)
            ).subscribe(list => {
              if (list && list.length === 1) {
                filterManager.selectItem(list[0].value);
              } else {
                filterManager.applyValue(paginationFilter.items);
              }
            });
            return;
          }

          filterManager.applyValue(paginationFilter.items);

        });
        this.cd.markForCheck();
      }),
    );

    // Multi filters (e.g. cf/org/space)
    // - Pass any multi filter changes made by the user to the pagination controller and thus the store
    // - If the first multi filter has one value it's not shown, ensure it's automatically selected to ensure other filters are correct
    this.multiFilterWidgetObservables = new Array<Subscription>();
    this.paginationController.filter$.pipe(
      take(1),
      tap(() => {
        Object.values(this.multiFilterManagers).forEach((filterManager: MultiFilterManager<T>, _index: number) => {
          // Pipe changes in the widgets to the store
          // Handle both BehaviorSubject and Signal wrappers
          const select$ = 'asObservable' in filterManager.multiFilterConfig.select
            ? filterManager.multiFilterConfig.select.asObservable()
            : toObservable(filterManager.multiFilterConfig.select, { injector: this.injector });
          const sub = select$.pipe(tap((filterItem: string) => {
            this.paginationController.multiFilter(filterManager.multiFilterConfig, filterItem);
          }));
          this.multiFilterWidgetObservables.push(sub.subscribe());
        });
      })
    ).subscribe();

    this.isFiltering$ = this.paginationController.filter$.pipe(
      map((f: ListFilter) => {
        const isFilteringByString = f.string ? !!f.string.length : false;
        const isFilteringByItems = Object.values(f.items).filter(value => !!value).length > 0;
        return isFilteringByString || isFilteringByItems;
      })
    );

    this.noRowsHaveFilter$ = observableCombineLatest(this.hasRows$, this.isFiltering$, this.dataSource.maxedResults$).pipe(
      map(([hasRows, isFiltering, maxedResults]) => !hasRows && isFiltering && !maxedResults)
    );

    this.noRowsNotFiltering$ = observableCombineLatest(this.hasRows$, this.isFiltering$, this.dataSource.maxedResults$).pipe(
      map(([hasRows, isFiltering, maxedResults]) => !hasRows && !isFiltering && !maxedResults)
    );

    this.hasRowsOrIsFiltering$ = observableCombineLatest(this.hasRows$, this.isFiltering$).pipe(
      map(([hasRows, isFiltering]) => hasRows || isFiltering)
    );

    this.disableActions$ = observableCombineLatest(this.dataSource.isLoadingPage$, this.noRowsHaveFilter$).pipe(
      map(([isLoading, noRowsHaveFilter]) => isLoading || noRowsHaveFilter)
    );

    // Multi actions can be a list of actions that aren't visible. For those case, in effect, we don't have multi actions
    const visibles$ = (this.multiActions || []).map(multiAction => multiAction.visible$);
    const haveMultiActions = observableCombineLatest(visibles$).pipe(
      map(visibles => visibles.some(visible => visible)),
      tap(allowSelection => {
        this.haveMultiActionsSignal.set(allowSelection);
        this.haveMultiActionsSubject.next(allowSelection);
      })
    );

    this.uberSub = observableCombineLatest(
      paginationStoreToWidget,
      sortStoreToWidget,
      haveMultiActions
    ).subscribe();

    const initialisedSub = observableCombineLatest([
      filterStoreToWidget // Should not be unsubbed until destroy
    ]).subscribe(() => {
      // When this fires the first time we're initialised
      if (!this.componentInitialised) {
        this.componentInitialised = true;
        this.initialised.next(true);
      }
    });

    this.subs.push(initialisedSub);

    this.pageState$ = observableCombineLatest(
      this.paginationController.pagination$,
      this.dataSource.isLoadingPage$,
      this.view$
    )
      .pipe(
        filter(([_pagination, _busy, viewType]) => viewType !== 'table'),
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

    const loadingHasChanged$ = this.dataSource.isLoadingPage$.pipe(
      distinctUntilChanged(),
      pairwise(),
      map(([oldLoading, newLoading]) =>
        oldLoading !== newLoading
      ),
      startWith(true)
    );

    const hasFilterChangedSinceLastLoading$ = loadingHasChanged$.pipe(
      filter(hasChanged => hasChanged),
      withLatestFrom(this.dataSource.pagination$),
      pairwise(),
      map(([oldData, newData]) => [oldData[1], newData[1]]),
      map(([oldPage, newPage]) =>
        oldPage.currentPage !== newPage.currentPage ||
        oldPage.clientPagination.filter !== newPage.clientPagination.filter ||
        oldPage.params !== newPage.params
      ),
      startWith(true)
    );

    this.isRefreshing$ = observableCombineLatest(hasFilterChangedSinceLastLoading$, this.dataSource.isLoadingPage$).pipe(
      map(([hasChanged, loading]) => !hasChanged && loading),
      startWith(false)
    );

    this.showProgressBar$ = this.dataSource.isLoadingPage$.pipe(
      withLatestFrom(this.isRefreshing$),
      map(([loading, isRefreshing]) => !isRefreshing && loading),
      distinctUntilChanged(),
      startWith(true),
    );
  }

  ngAfterViewInit() {
    this.cd.detectChanges();
    // Check scroll shadow when data changes
    if (this.hasRows$) {
      this.subs.push(
        this.hasRows$.subscribe(() => setTimeout(() => this.updateScrollShadow()))
      );
    }
    if (this.paginationController?.pagination$) {
      this.subs.push(
        this.paginationController.pagination$.subscribe(() => setTimeout(() => this.updateScrollShadow()))
      );
    }
  }

  ngOnDestroy() {
    safeUnsubscribe(
      ...this.multiFilterWidgetObservables,
      this.paginationWidgetToStore,
      this.filterWidgetToStore,
      this.uberSub,
      this.multiFilterChangesSub,
      ...this.subs,
    );
    if (this.dataSource) {
      this.dataSource.destroy();
    }
    this.pendingActions.forEach(sub => sub.unsubscribe());
  }

  private getDefaultListView(config: IListConfig<T>) {
    switch (config.viewType) {
      case ListViewTypes.TABLE_ONLY:
        return 'table';
      case ListViewTypes.CARD_ONLY:
        return 'cards';
      default:
        return this.config?.defaultView || this.branding.getDefaultViewMode() || 'table';
    }
  }

  public clearFilterText() {
    this.filterString = '';
    this.paginationController.filterByString('');
  }

  getVisibleStart(): number {
    return this.paginatorSettings.length > 0
      ? this.paginatorSettings.pageIndex * this.paginatorSettings.pageSize + 1
      : 0;
  }

  getVisibleEnd(): number {
    return Math.min(
      (this.paginatorSettings.pageIndex + 1) * this.paginatorSettings.pageSize,
      this.paginatorSettings.length
    );
  }

  showScrollShadow = signal(false);

  onBodyScroll(event: Event) {
    const el = event.target as HTMLElement;
    this.updateScrollShadow(el);
  }

  private updateScrollShadow(el?: HTMLElement) {
    if (!el) {
      el = this.elRef.nativeElement.querySelector('.list-component__body-inner') as HTMLElement;
    }
    if (!el) return;
    const hasMore = el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    if (this.showScrollShadow() !== hasMore) {
      this.showScrollShadow.set(hasMore);
      this.cd.markForCheck();
    }
  }


  public resetFilteringAndSort() {
    /* tslint:disable-next-line:no-string-literal  */
    const pAction: PaginatedAction = (this.dataSource.action as any)['length'] ? (this.dataSource.action as any)[0] : this.dataSource.action;
    this.store.dispatch(new ResetPaginationSortFilter(pAction));

    if (!this.dataSource.isLocal) {
      this.store.dispatch(new ResetPagination(pAction, pAction.paginationKey));
    }

    // Reset the multi-filter dropdowns (org/space selections)
    if (this.multiFilterManagers) {
      this.multiFilterManagers.forEach(filterManager => {
        if (filterManager.multiFilterConfig.select) {
          filterManager.multiFilterConfig.select.next(undefined);
        }
      });
    }

    // Reset text filter
    this.clearFilterText();

    // Reset the multi-entity filter
    this.entitySelectValue.set(undefined);
    this.entitySelectValueSubject.next(undefined);
    this.setEntityPage(undefined);
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

  updateListFilter(filterSelected: IListFilter) {
    this.store.dispatch(new SetClientFilterKey(
      this.dataSource,
      this.dataSource.paginationKey,
      filterSelected.key
    ));
  }

  onPaginateChange(pageEvent: PageEvent) {
    const pageSizeChanged = this.paginatorSettings.pageSize !== pageEvent.pageSize;
    const pageChanged = this.paginatorSettings.pageIndex !== pageEvent.pageIndex;

    if (pageSizeChanged) {
      this.paginationController.pageSize(pageEvent.pageSize);
      // Remember the user's explicit choice per view (cards/table).
      // If the effective size equals the total, find which sentinel matches.
      const matchingSentinel = this.paginatorSettings.pageSizeOptions.find(opt =>
        isPageSizeSentinel(opt) && resolvePageSize(opt, pageEvent.length) === pageEvent.pageSize
      );
      const sizeToStore = matchingSentinel !== undefined ? matchingSentinel : pageEvent.pageSize;
      const viewKey = `${this.dataSource.paginationKey}:${this.currentView}`;
      this.pageSizeSession.set(viewKey, sizeToStore);
      // Also store without view suffix for cross-screen inheritance
      this.pageSizeSession.set(this.dataSource.paginationKey, sizeToStore);
      if (this.dataSource.isLocal) {
        this.paginationController.page(0);
      }
    } else if (pageChanged) {
      this.paginationController.page(pageEvent.pageIndex);
    }
  }

  executeActionMultiple(listActionConfig: IMultiListAction<T>) {
    const result = listActionConfig.action(Array.from(this.dataSource.selectedRows().values()));
    if (isObservable(result)) {
      const sub = this.getActionSub(result);
      this.pendingActions.set(result, sub);
    } else {
      this.dataSource.selectClear();
    }
  }

  private getActionSub(result: Observable<ActionState>) {
    const sub = result.pipe(
      subscribeOn(asapScheduler)
    ).subscribe(done => {
      if (!done.busy) {
        this.pendingActions.delete(result);
        sub.unsubscribe();
        if (!done.error) {
          this.dataSource.selectClear();
        }
      }
    });
    return sub;
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
      );
    }
  }

  /**
   * Helper method to calculate the last item index on the current page
   */
  public getPageEndIndex(): number {
    if (!this.paginatorSettings) {
      return 0;
    }
    const { pageIndex, pageSize, length } = this.paginatorSettings;
    return Math.min((pageIndex + 1) * pageSize, length);
  }

  /**
   * Helper method to calculate the last page index
   */
  public getLastPageIndex(): number {
    if (!this.paginatorSettings || !this.paginatorSettings.pageSize) {
      return 0;
    }
    const { length, pageSize } = this.paginatorSettings;
    return Math.floor(length / pageSize);
  }

  // Used by multi-entity lists
  public setEntityPage(page: number) {
    this.pPaginator.firstPage();
    this.store.dispatch(new SetPage(
      this.dataSource,
      this.dataSource.paginationKey,
      page,
      true,
      true
    ));
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

  private getRowStateGeneratorFromEntityMonitor(entityConfig: EntityCatalogEntityConfig, dataSource: IListDataSource<T>) {
    return (row: any) => {
      if (!entityConfig || !row) {
        return observableOf(getDefaultRowState());
      }
      const catalogEntity = entityCatalog.getEntity(entityConfig);
      const entityMonitor = catalogEntity.store.getEntityMonitor(
        dataSource.getRowUniqueId(row),
        {
          schemaKey: entityConfig.schemaKey
        }
      );
      return entityMonitor.entityRequest$.pipe(
        distinctUntilChanged(),
        map(requestInfo => ({
          deleting: requestInfo.deleting.busy,
          error: requestInfo.deleting.error,
          message: requestInfo.deleting.error ? requestInfo.deleting.message || `Sorry, deletion failed` : null
        }))
      );
    };
  }

  private getRowStateFromRowsState = (row: T): Observable<RowState> =>
    this.dataSource.rowsState.pipe(map(state => state[this.dataSource.getRowUniqueId(row)] || getDefaultRowState()));

  public showAllAfterMax() {
    this.dataSource.showAllAfterMax();
  }

  // TrackBy functions for @for loops to optimize change detection
  trackByAction(index: number, action: IOptionalAction<T>): string {
    return action.label || index.toString();
  }

  trackByMultiFilterManager(index: number, manager: MultiFilterManager<T>): string {
    return manager.filterKey;
  }

  trackByFilterItem(index: number, item: IListMultiFilterConfigItem): string {
    return item.value;
  }

  trackByEntitySelectItem(index: number, item: any): number {
    return item.page;
  }

  trackByFilter(index: number, filter: IListFilter): string {
    return filter.key;
  }

  trackByColumn(index: number, column: ITableColumn<T>): string {
    return column.columnId || index.toString();
  }
}
