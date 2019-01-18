import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';

import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { GitCommit } from '../../../../../store/types/git.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListConfig, ListViewTypes } from '../../list.component.types';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { TableCellCommitAuthorComponent } from './table-cell-commit-author/table-cell-commit-author.component';

@Injectable()
export abstract class GithubCommitsListConfigServiceBase implements IListConfig<APIResource<GitCommit>> {
  protected dataSource: GithubCommitsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Commits',
    noEntries: 'There are no commits'
  };

  protected columns: ITableColumn<APIResource<GitCommit>>[] = [
    {
      columnId: 'message',
      headerCell: () => 'Message',
      cellDefinition: {
        valuePath: 'entity.commit.message'
      },
      sort: {
        type: 'sort',
        orderKey: 'message',
        field: 'entity.commit.message'
      },
      cellFlex: '3',
      class: 'app-table__cell--table-column-clip'
    },
    {
      columnId: 'sha',
      headerCell: () => 'SHA',
      cellDefinition: {
        externalLink: true,
        newTab: true,
        getLink: (commit) => commit.entity.html_url,
        getValue: (commit) => commit.entity.sha.substring(0, 8)
      },
      sort: {
        type: 'sort',
        orderKey: 'sha',
        field: 'entity.sha'
      },
      cellFlex: '2'
    },
    {
      columnId: 'author',
      headerCell: () => 'Author',
      cellComponent: TableCellCommitAuthorComponent,
      sort: {
        type: 'sort',
        orderKey: 'author',
        field: 'entity.commit.author.name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'date',
      headerCell: () => 'Date',
      cellDefinition: {
        getValue: (commit) => this.datePipe.transform(commit.entity.commit.author.date, 'medium')
      },
      sort: {
        type: 'sort',
        orderKey: 'date',
        field: 'entity.commit.author.date'
      },
      cellFlex: '2'
    },
  ];

  protected projectName: string;
  protected branchName: string;

  protected initialised = new BehaviorSubject<boolean>(false);

  constructor(
    protected store: Store<AppState>,
    private datePipe: DatePipe,
  ) { }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
  public getInitialised = () => this.initialised;
}
