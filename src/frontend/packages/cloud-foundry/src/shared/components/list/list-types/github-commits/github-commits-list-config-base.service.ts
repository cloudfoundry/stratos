import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { GitCommit } from '../../../../../../../cloud-foundry/src/store/types/git.types';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { IListConfig, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { TableCellCommitAuthorComponent } from './table-cell-commit-author/table-cell-commit-author.component';

@Injectable()
export abstract class GithubCommitsListConfigServiceBase implements IListConfig<GitCommit> {
  protected dataSource: GithubCommitsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Commits',
    noEntries: 'There are no commits'
  };

  protected columns: ITableColumn<GitCommit>[] = [
    {
      columnId: 'message',
      headerCell: () => 'Message',
      cellDefinition: {
        valuePath: 'commit.message'
      },
      sort: {
        type: 'sort',
        orderKey: 'message',
        field: 'commit.message'
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
        getLink: (commit) => commit.html_url,
        getValue: (commit) => commit.sha.substring(0, 8)
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
        field: 'commit.author.name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'date',
      headerCell: () => 'Date',
      cellDefinition: {
        getValue: (commit) => this.datePipe.transform(commit.commit.author.date, 'medium')
      },
      sort: {
        type: 'sort',
        orderKey: 'date',
        field: 'commit.author.date'
      },
      cellFlex: '2'
    },
  ];

  protected projectName: string;
  protected branchName: string;

  protected initialised = new BehaviorSubject<boolean>(false);

  constructor(
    protected store: Store<CFAppState>,
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
