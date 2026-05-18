import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@stratosui/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { ActiveRouteCfCell } from '../../../../../features/cf/cf-page.types';
import { StApp } from '../../../../../services/endpoint-data/stratos-types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellApp, CfCellAppsDataSource } from './cf-cell-apps-source';

@Injectable({
  providedIn: 'root'
})
export class CfCellAppsListConfigService extends BaseCfListConfig<CfCellApp> {
  private store = inject(Store<CFAppState>);
  private activeRouteCfCell = inject(ActiveRouteCfCell);
  private http = inject(HttpClient);

  dataSource: CfCellAppsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text: { title: string | null; noEntries: string } = {
    title: null as string | null,
    noEntries: 'There are no applications'
  };

  constructor() {
    super();
    this.dataSource = new CfCellAppsDataSource(this.store, this.http, this.activeRouteCfCell.cfGuid, this.activeRouteCfCell.cellId, this as BaseCfListConfig<CfCellApp>);
  }

  getColumns = (): ITableColumn<CfCellApp>[] => [
    {
      columnId: 'app',
      headerCell: () => 'App Name',
      cellFlex: '1',
      cellDefinition: {
        getAsyncLink: (value: StApp) => value ? `/applications/${value.cnsiGuid}/${value.guid}/summary` : null,
        asyncValue: {
          pathToObs: 'app$',
          pathToValue: 'name'
        }
      },
    },
    {
      columnId: 'appInstance',
      headerCell: () => 'App Instance',
      cellDefinition: {
        valuePath: 'metric.instance_index',
        getLink: (row: CfCellApp) => `/applications/${this.activeRouteCfCell.cfGuid}/${row.appGuid}/instances`
      },
      cellFlex: '1',
    },
    {
      columnId: 'space',
      headerCell: () => 'Space',
      cellFlex: '1',
      cellDefinition: {
        getAsyncLink: (value: StApp) => {
          if (!value || !value.orgGuid || !value.spaceGuid) {
            return null;
          }
          return `/cloud-foundry/${value.cnsiGuid}/organizations/${value.orgGuid}/spaces/${value.spaceGuid}/summary`;
        },
        asyncValue: {
          pathToObs: 'app$',
          pathToValue: 'spaceName'
        }
      },
    },
    {
      columnId: 'org', headerCell: () => 'Organization',
      cellFlex: '1',
      cellDefinition: {
        getAsyncLink: (value: StApp) => {
          if (!value || !value.orgGuid) {
            return null;
          }
          return `/cloud-foundry/${value.cnsiGuid}/organizations/${value.orgGuid}/summary`;
        },
        asyncValue: {
          pathToObs: 'app$',
          pathToValue: 'orgName'
        }
      },
    },
  ]
  getDataSource = () => this.dataSource;
}
