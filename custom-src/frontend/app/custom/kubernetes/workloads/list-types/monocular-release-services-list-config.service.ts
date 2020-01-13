import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { ITableColumn } from 'frontend/packages/core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from 'frontend/packages/core/src/shared/components/list/list.component.types';
import { ListView } from 'frontend/packages/store/src/actions/list.actions';
import { AppState } from 'frontend/packages/store/src/app-state';
import { Observable } from 'rxjs';

import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleaseService } from '../workload.types';
import { HelmReleaseServiceCardComponent } from './helm-release-service-card/helm-release-service-card.component';
import { HelmServicePortsComponent } from './helm-service-ports/helm-service-ports.component';
import { HelmReleaseServicesDataSource } from './monocular-release-services-list-source';

@Injectable()
export class HelmReleaseServicesListConfig implements IListConfig<HelmReleaseService> {
  isLocal = true;
  dataSource: HelmReleaseServicesDataSource;
  viewType = ListViewTypes.BOTH;
  defaultView = 'cards' as ListView;
  cardComponent = HelmReleaseServiceCardComponent;
  tableFixedRowHeight = true;
  columns: ITableColumn<HelmReleaseService>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'name'
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '4'
    },
    {
      columnId: 'clusterIp',
      headerCell: () => 'Cluster IP',
      cellDefinition: {
        asyncValue: {
          pathToObs: 'kubeService$',
          pathToValue: 'spec.clusterIP'
        }
      },
      cellFlex: '2'
    },
    {
      columnId: 'portType',
      headerCell: () => 'Port Type',
      cellDefinition: {
        asyncValue: {
          pathToObs: 'kubeService$',
          pathToValue: 'spec.type'
        }
      },
      cellFlex: '2'
    },
    {
      columnId: 'Ports',
      headerCell: () => 'Ports',
      cellComponent: HelmServicePortsComponent,
      cellFlex: '4'
    },
  ];
  initialised$: Observable<boolean>;


  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    helmReleaseHelper: HelmReleaseHelperService
  ) {
    this.dataSource = new HelmReleaseServicesDataSource(this.store, this, helmReleaseHelper.endpointGuid, helmReleaseHelper.releaseTitle);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
