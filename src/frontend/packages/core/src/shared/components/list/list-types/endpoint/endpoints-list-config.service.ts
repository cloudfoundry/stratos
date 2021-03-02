import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, of, Subscription } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { SetClientFilter } from '../../../../../../../store/src/actions/pagination.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { EntityMonitorFactory } from '../../../../../../../store/src/monitors/entity-monitor.factory.service';
import { InternalEventMonitorFactory } from '../../../../../../../store/src/monitors/internal-event-monitor.factory';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { stratosEntityCatalog } from '../../../../../../../store/src/stratos-entity-catalog';
import { EndpointModel } from '../../../../../../../store/src/types/endpoint.types';
import { PaginationEntityState } from '../../../../../../../store/src/types/pagination.types';
import { UserFavoriteManager } from '../../../../../../../store/src/user-favorite-manager';
import { SessionService } from '../../../../services/session.service';
import { createTableColumnFavorite } from '../../list-table/table-cell-favorite/table-cell-favorite.component';
import { ITableColumn } from '../../list-table/table.types';
import {
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IListMultiFilterConfigItem,
  ListViewTypes,
} from '../../list.component.types';
import { BaseEndpointsDataSource } from './base-endpoints-data-source';
import { EndpointCardComponent } from './endpoint-card/endpoint-card.component';
import { EndpointListHelper } from './endpoint-list.helpers';
import { EndpointsDataSource } from './endpoints-data-source';
import { TableCellEndpointAddressComponent } from './table-cell-endpoint-address/table-cell-endpoint-address.component';
import { TableCellEndpointCreatorComponent } from './table-cell-endpoint-creator/table-cell-endpoint-creator.component';
import { TableCellEndpointDetailsComponent } from './table-cell-endpoint-details/table-cell-endpoint-details.component';
import { TableCellEndpointNameComponent } from './table-cell-endpoint-name/table-cell-endpoint-name.component';
import { TableCellEndpointStatusComponent } from './table-cell-endpoint-status/table-cell-endpoint-status.component';



@Injectable()
export class EndpointsListConfigService implements IListConfig<EndpointModel>, OnDestroy {
  cardComponent = EndpointCardComponent;

  private singleActions: IListAction<EndpointModel>[];

  public readonly columns: ITableColumn<EndpointModel>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellComponent: TableCellEndpointNameComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'connection',
      headerCell: () => 'Status',
      cellComponent: TableCellEndpointStatusComponent,
      sort: {
        type: 'sort',
        orderKey: 'connection',
        field: 'user'
      },
      cellFlex: '1',
      cellConfig: {
        showLabel: false
      }
    },
    {
      columnId: 'type',
      headerCell: () => 'Type',
      cellDefinition: {
        getValue: this.getEndpointTypeString
      },
      sort: {
        type: 'sort',
        orderKey: 'type',
        field: 'cnsi_type'
      },
      cellFlex: '2'
    },
    {
      columnId: 'address',
      headerCell: () => 'Address',
      cellComponent: TableCellEndpointAddressComponent,
      sort: {
        type: 'sort',
        orderKey: 'address',
        field: 'api_endpoint.Host'
      },
      cellFlex: '5'
    },
    {
      columnId: 'details',
      headerCell: () => 'Details',
      cellComponent: TableCellEndpointDetailsComponent,
      cellFlex: '4'
    }
  ];

  isLocal = true;
  dataSource: EndpointsDataSource;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;
  text = {
    title: '',
    filter: 'Filter Endpoints'
  };
  enableTextFilter = true;
  userEndpointsSubscription: Subscription;

  constructor(
    private store: Store<AppState>,
    paginationMonitorFactory: PaginationMonitorFactory,
    entityMonitorFactory: EntityMonitorFactory,
    internalEventMonitorFactory: InternalEventMonitorFactory,
    endpointListHelper: EndpointListHelper,
    userFavoriteManager: UserFavoriteManager,
    sessionService: SessionService
  ) {
    this.singleActions = endpointListHelper.endpointActions();
    const favoriteCell = createTableColumnFavorite(
      (row: EndpointModel) => userFavoriteManager.getFavoriteEndpointFromEntity(row)
    );
    this.columns.push(favoriteCell);
    this.userEndpointsSubscription = sessionService.userEndpointsNotDisabled().subscribe(enabled => {
      if (enabled){
        this.columns.splice(4, 0,  {
          columnId: 'creator',
          headerCell: () => 'Creator',
          cellComponent: TableCellEndpointCreatorComponent,
          sort: {
            type: 'sort',
            orderKey: 'creator',
            field: 'creator.name'
          },
          cellFlex: '2'
        });
      }
    });

    this.dataSource = new EndpointsDataSource(
      this.store,
      this,
      paginationMonitorFactory,
      entityMonitorFactory,
      internalEventMonitorFactory,
      true
    );
  }

  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => this.singleActions;
  public getColumns = () => this.columns;
  public getDataSource = () => this.dataSource;

  public getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [this.createEndpointTypeFilter()];

  private getEndpointTypeString(endpoint: EndpointModel): string {
    return entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition.label;
  }

  private createEndpointTypeFilter(): IListMultiFilterConfig {
    return {
      key: BaseEndpointsDataSource.typeFilterKey,
      label: 'Endpoint Type',
      list$: combineLatest([
        stratosEntityCatalog.endpoint.store.getPaginationMonitor().currentPage$,
        stratosEntityCatalog.endpoint.store.getPaginationMonitor().pagination$
      ]).pipe(
        debounceTime(100), // This can get pretty spammy, to help protect resetEndpointTypeFilter allow a pause
        filter(([endpoints]) => !!endpoints),
        map(([endpoints, pagination]) => {
          // Provide a list of endpoint types only if there are more than two registered endpoint types
          const types: { [type: string]: boolean; } = {};
          for (const endpoint of endpoints) {
            types[endpoint.cnsi_type] = true;
          }
          if (Object.values(types).filter(type => type).length < 2) {
            // If we're going to hid the endpoint filter ensure any existing filter value is reset
            this.resetEndpointTypeFilter(pagination);
            return [];
          }
          return entityCatalog.getAllBaseEndpointTypes()
            .sort((a, b) => a.definition.renderPriority - b.definition.renderPriority)
            .filter(et => types[et.type])
            .map(et => {
              const res: IListMultiFilterConfigItem = {
                label: et.definition.label,
                item: et,
                value: et.type
              };
              return res;
            });
        })
      ),
      loading$: of(false),
      select: new BehaviorSubject(undefined)
    };
  }

  private resetEndpointTypeFilter(pagination: PaginationEntityState) {
    if (
      pagination.clientPagination &&
      pagination.clientPagination.filter &&
      pagination.clientPagination.filter.items[BaseEndpointsDataSource.typeFilterKey]
    ) {
      const clientPaginationFilter = {
        ...pagination.clientPagination.filter,
        items: {
          ...pagination.clientPagination.filter.items,
          [BaseEndpointsDataSource.typeFilterKey]: null
        }
      };
      this.store.dispatch(
        new SetClientFilter(this.dataSource.masterAction, this.dataSource.paginationKey, clientPaginationFilter)
      );
    }
  }

  ngOnDestroy() {
    this.userEndpointsSubscription.unsubscribe();
  }
}
