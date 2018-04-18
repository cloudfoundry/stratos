import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, first } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import {
  CheckProjectExists,
  SetAppSourceDetails,
  SetDeployBranch,
  SetDeployCommit,
  StoreCFSettings,
  FetchBranchesForProject,
} from '../../../../../store/actions/deploy-applications.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { GithubCommit } from '../../../../../store/types/github.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { TableCellCommitParentsComponent } from './table-cell-commit-parents/table-cell-commit-parents.component';
import { githubBranchesSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TableCellCommitAuthorComponent } from './table-cell-commit-author/table-cell-commit-author.component';

@Injectable()
export class GithubCommitsListConfigService implements IListConfig<APIResource<GithubCommit>> {
  dataSource: GithubCommitsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Commits',
    noEntries: 'There are no commits'
  };

  private columns: ITableColumn<APIResource<GithubCommit>>[] = [
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
      cellFlex: '2',
      class: 'app-table__cell--table-column-clip'
    },
    {
      columnId: 'sha',
      headerCell: () => 'SHA',
      cellDefinition: {
        externalLink: true,
        getLink: (commit) => commit.entity.html_url,
        getValue: (commit) => commit.entity.sha.substring(0, 8)
      },
      sort: {
        type: 'sort',
        orderKey: 'sha',
        field: 'entity.sha'
      },
      cellFlex: '1'
    },
    {
      columnId: 'parentShas',
      headerCell: () => 'Parent Commits',
      cellComponent: TableCellCommitParentsComponent,
      cellFlex: '1',
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
  private listActionRedeploy: IListAction<APIResource<GithubCommit>> = {
    action: (item) => {
      // set CF data
      this.store.dispatch(
        new StoreCFSettings({
          cloudFoundry: this.cfGuid,
          org: this.orgGuid,
          space: this.spaceGuid
        })
      );
      // Set Project data
      this.store.dispatch(
        new CheckProjectExists(this.projectName)
      );
      // Set Source type
      this.store.dispatch(
        new SetAppSourceDetails({
          name: 'Git',
          id: 'git',
          subType: 'github'
        })
      );
      // Set branch
      this.store.dispatch(new SetDeployBranch(this.branchName));
      // Set Commit
      this.store.dispatch(new SetDeployCommit(item.entity.sha));

      this.store.dispatch(
        new RouterNav({
          path: ['/applications/deploy'],
          query: { redeploy: this.appGuid }
        })
      );
    },
    label: 'Redeploy',
    description: ``,
    visible: row => true,
    enabled: row => true,
  };

  private projectName: string;
  private branchName: string;
  private cfGuid: string;
  private orgGuid: string;
  private spaceGuid: string;
  private appGuid: string;

  private initialised = new BehaviorSubject<boolean>(false);

  constructor(
    private store: Store<AppState>,
    private datePipe: DatePipe,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory
  ) {
    this.applicationService.waitForAppEntity$.pipe(
      combineLatest(this.applicationService.appSpace$),
      first(),
    ).subscribe(([app, space]) => {
      this.cfGuid = app.entity.entity.cfGuid;
      this.spaceGuid = app.entity.entity.space_guid;
      this.orgGuid = space.entity.organization_guid;
      this.appGuid = app.entity.metadata.guid;
    });

    this.applicationService.applicationStratProject$.pipe(
      first(),
    ).subscribe(stratosProject => {
      this.projectName = stratosProject.deploySource.project;

      const branchKey = `${this.projectName}-${stratosProject.deploySource.branch}`;
      const gitBranchEntityService = this.entityServiceFactory.create<APIResource>(
        githubBranchesSchemaKey,
        entityFactory(githubBranchesSchemaKey),
        branchKey,
        new FetchBranchesForProject(this.projectName),
        false
      );
      gitBranchEntityService.entityObs$.pipe(
        first(),
      ).subscribe(branch => {
        this.branchName = branch.entity.entity.name;
        this.dataSource = new GithubCommitsDataSource(this.store, this, this.projectName);
        this.initialised.next(true);
      });
    });
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [this.listActionRedeploy];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
  public getInitialised = () => this.initialised;
}
