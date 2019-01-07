
import { of as observableOf, Observable } from 'rxjs';
import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { combineLatest, filter, first, map } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import {
  CheckProjectExists,
  FetchBranchesForProject,
  SetAppSourceDetails,
  SetDeployBranch,
  SetDeployCommit,
  StoreCFSettings,
} from '../../../../../store/actions/deploy-applications.actions';
import { RouterNav } from '../../../../../store/actions/router.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, gitBranchesSchemaKey, gitCommitSchemaKey } from '../../../../../store/helpers/entity-factory';
import { selectEntity } from '../../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../../store/types/api.types';
import { GitCommit } from '../../../../../store/types/git.types';
import { IListAction } from '../../list.component.types';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';
import { GitSCMService, GitSCMType } from '../../../../data-services/scm/scm.service';
import { GitSCM } from '../../../../data-services/scm/scm';

@Injectable()
export class GithubCommitsListConfigServiceAppTab extends GithubCommitsListConfigServiceBase {

  private listActionRedeploy: IListAction<APIResource<GitCommit>> = {
    action: (commitEntity) => {
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
        new CheckProjectExists(this.scm, this.projectName)
      );
      // Set Source type
      this.store.dispatch(
        new SetAppSourceDetails({
          name: this.scm.getLabel(),
          id: this.scm.getType(),
          group: 'gitscm'
        })
      );
      // Set branch
      this.store.dispatch(new SetDeployBranch(this.branchName));
      // Set Commit
      this.store.dispatch(new SetDeployCommit(commitEntity.entity.sha));

      this.store.dispatch(
        new RouterNav({
          path: ['/applications/deploy'],
          query: { appGuid: this.appGuid }
        })
      );
    },
    label: 'Deploy',
    description: ``,
  };

  private listActionCompare: IListAction<APIResource<GitCommit>> = {
    action: (compareToCommit) => {
      window.open(this.getCompareURL(compareToCommit.entity.sha), '_blank');
    },
    label: 'Compare',
    description: '',
    createEnabled: (commit$: Observable<APIResource<GitCommit>>) => {
      return commit$.pipe(map(commit => {
        const isDeployedCommit = commit.entity.sha === this.deployedCommitSha;
        if (!isDeployedCommit) {
          // The github url will show 'no change' if the compare to commit is earlier in the tree than the deployed commit. We could swap
          // these around for those cases... however the diff +/- is then incorrect. So until we have a better way of doing this disable
          // the button instead
          return this.deployedTime < moment(commit.entity.commit.author.date).unix();
        }
        return false;
      }));
    }
  };

  private cfGuid: string;
  private orgGuid: string;
  private spaceGuid: string;
  private appGuid: string;
  private deployedCommitSha: string;
  private deployedCommit: GitCommit;
  private deployedTime: number;
  private scm: GitSCM;

  constructor(
    store: Store<AppState>,
    datePipe: DatePipe,
    private scmService: GitSCMService,
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
      this.deployedCommitSha = stratosProject.deploySource.commit;
      const scmType = stratosProject.deploySource.scm || stratosProject.deploySource.type;
      this.scm = this.scmService.getSCM(scmType as GitSCMType);

      const branchKey = `${this.projectName}-${stratosProject.deploySource.branch}`;
      const gitBranchEntityService = this.entityServiceFactory.create<APIResource>(
        gitBranchesSchemaKey,
        entityFactory(gitBranchesSchemaKey),
        branchKey,
        new FetchBranchesForProject(this.scm, this.projectName),
        false
      );
      gitBranchEntityService.waitForEntity$.pipe(
        first(),
      ).subscribe(branch => {
        this.branchName = branch.entity.entity.name;
        this.dataSource = new GithubCommitsDataSource(
          this.store, this, this.scm, this.projectName, this.branchName, this.deployedCommitSha);
        this.initialised.next(true);
      });

      this.setDeployedCommitDetails();
    });
  }

  private getCompareURL(sha: string): string {
    return this.scm.getCompareCommitURL(this.projectName, this.deployedCommitSha, sha);
  }

  private setDeployedCommitDetails() {
    this.store.select(
      selectEntity<APIResource<GitCommit>>(gitCommitSchemaKey, this.projectName + '-' + this.deployedCommitSha))
      .pipe(
        filter(deployedCommit => !!deployedCommit),
        first(),
        map(deployedCommit => deployedCommit.entity)
      ).subscribe(deployedCommit => {
        this.deployedCommit = deployedCommit;
        this.deployedTime = moment(this.deployedCommit.commit.author.date).unix();
      });
  }

  public getSingleActions = () => [this.listActionRedeploy, this.listActionCompare];
}
