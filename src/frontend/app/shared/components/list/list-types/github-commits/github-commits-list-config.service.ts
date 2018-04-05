import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/app-state';
import { IListConfig, ListViewTypes, IListAction } from '../../list.component.types';
import { GithubCommit } from '../../../../../store/types/github.types';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { ITableColumn } from '../../list-table/table.types';

@Injectable()
export class GithubCommitsListConfigService implements IListConfig<GithubCommit> {
  dataSource: GithubCommitsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  columns: ITableColumn<GithubCommit>[] = [
    {
      columnId: 'message',
      headerCell: () => 'Message',
      cellDefinition: {
        valuePath: 'commit.message'
      },
      sort: {
        type: 'sort',
        orderKey: 'sha',
        field: 'commit.message'
      },
      cellFlex: '1'
    },
    {
      columnId: 'SHA',
      headerCell: () => 'SHA',
      cellDefinition: {
        valuePath: 'sha'
      },
      sort: {
        type: 'sort',
        orderKey: 'sha',
        field: 'sha'
      },
      cellFlex: '1'
    },
    {
      columnId: 'date',
      headerCell: () => 'Date',
      cellDefinition: {
        valuePath: 'commit.author.date'
      },
      sort: {
        type: 'sort',
        orderKey: 'date',
        field: 'commit.author.date'
      },
      cellFlex: '1'
    },
    {
      columnId: 'author',
      headerCell: () => 'Author',
      cellDefinition: {
        getValue: (row) => `${row.commit.author.name} <${row.commit.author.email}>`
      },
      sort: {
        type: 'sort',
        orderKey: 'author',
        field: 'commit.author.name'
      },
      cellFlex: '1'
    }
  ];
  private listActionRedeploy: IListAction<EndpointModel> = {
    action: (item) => {
      console.log('REDEPLOY');
      // this.store.dispatch(new DisconnectEndpoint(item.guid));
      // this.handleUpdateAction(item, EndpointsEffect.disconnectingKey, ([oldVal, newVal]) => {
      //   this.store.dispatch(new ShowSnackBar(`Disconnected ${item.name}`));
      //   this.store.dispatch(new GetSystemInfo());
      // });
    },
    label: 'Redeploy',
    description: ``,
    visible: row => true,
    enabled: row => true,
  };

  constructor(private store: Store<AppState>, private projectName: string) {
    this.dataSource = new GithubCommitsDataSource(this.store, this, projectName);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
