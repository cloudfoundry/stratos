import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

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
import { IListAction } from '../../list.component.types';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';
import { combineLatest } from 'rxjs/operators';
import { first } from 'rxjs/operators';
import { githubBranchesSchemaKey, entityFactory } from '../../../../../store/helpers/entity-factory';
import { GithubCommitsDataSource } from './github-commits-data-source';

@Injectable()
export class GithubCommitsListConfigServiceAppTab extends GithubCommitsListConfigServiceBase {

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

  private cfGuid: string;
  private orgGuid: string;
  private spaceGuid: string;
  private appGuid: string;

  constructor(
    store: Store<AppState>,
    datePipe: DatePipe,
    private applicationService: ApplicationService,
    private entityServiceFactory: EntityServiceFactory
  ) {
    super(store, datePipe);

    this.setGuids();
    this.setGithubDetails();

  }

  private setGuids() {
    this.applicationService.waitForAppEntity$.pipe(
      combineLatest(this.applicationService.appSpace$),
      first(),
    ).subscribe(([app, space]) => {
      this.cfGuid = app.entity.entity.cfGuid;
      this.spaceGuid = app.entity.entity.space_guid;
      this.orgGuid = space.entity.organization_guid;
      this.appGuid = app.entity.metadata.guid;
    });
  }

  private setGithubDetails() {
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
        this.dataSource = new GithubCommitsDataSource(this.store, this, this.projectName, this.branchName);
        this.initialised.next(true);
      });
    });
  }

  public getSingleActions = () => [this.listActionRedeploy];
}
