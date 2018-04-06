import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { GithubCommit } from '../../../../../store/types/github.types';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { spaceSchemaKey, githubBranchesSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { first, tap, combineLatest } from 'rxjs/operators';
import { CheckProjectExists, SetAppSourceDetails, SetDeployBranch, FetchBranchesForProject } from '../../../../../store/actions/deploy-applications.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';

@Injectable()
export class GithubCommitsListConfigService implements IListConfig<APIResource<GithubCommit>> {
  dataSource: GithubCommitsDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
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
      cellFlex: '2'
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
    {
      columnId: 'author',
      headerCell: () => 'Author',
      cellDefinition: {
        externalLink: true,
        getLink: (commit) => commit.entity.author.html_url,
        getValue: (commit) => commit.entity.commit.author.name
      },
      sort: {
        type: 'sort',
        orderKey: 'author',
        field: 'entity.commit.author.name'
      },
      cellFlex: '2'
    }
  ];
  private listActionRedeploy: IListAction<APIResource<GithubCommit>> = {
    action: (item) => {
      // set Project data
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
      // TODO: RC set commit and load it in deploy stepper

      this.store.dispatch(
        new RouterNav({
          path: ['/applications/deploy'],
          query: { redeploy: true }
        })
      );
    },
    label: 'Deploy',
    description: ``,
    visible: row => true,
    enabled: row => true,
  };

  private projectName: string;
  private branchName: string;

  constructor(
    private store: Store<AppState>,
    private datePipe: DatePipe,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory
  ) {
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
        // TODO: RC This will not work. The creation of the datasource must occur synchronously in the ctor. These values need to be passed
        // in... however this instance is created via a provider... which doesn't support async loading
        this.dataSource = new GithubCommitsDataSource(this.store, this, this.projectName);
      });
    });
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [this.listActionRedeploy];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
