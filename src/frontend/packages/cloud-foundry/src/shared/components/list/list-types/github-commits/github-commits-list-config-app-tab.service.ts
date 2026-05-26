import { Injectable, inject } from '@angular/core';
import { Store } from '@stratosui/store';
import {
  GitCommit,
  gitEntityCatalog,
  GithubCommitsDataSource,
  GithubCommitsListConfigServiceBase,
  GitMeta,
  GitSCM,
  GitSCMService,
  GitSCMType } from '@stratosui/git';
import { getUnixTime } from 'date-fns';
import { Observable } from 'rxjs';
import { take, combineLatest, filter, map } from 'rxjs/operators';

import { IListAction } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { getCommitGuid } from '../../../../../../../git/src/store/git-entity-factory';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfDeployAppDataService } from '../../../../../services/domain-data/cf-deploy-app-data.service';

@Injectable({
  providedIn: 'root'
})
export class GithubCommitsListConfigServiceAppTab extends GithubCommitsListConfigServiceBase {
  private scmService = inject(GitSCMService);
  private applicationService = inject(ApplicationService);
  private deployData = inject(CfDeployAppDataService);


  constructor() {
    const store = inject<Store<CFAppState>>(Store);

    super();
    this.setGuids();
    this.setGithubDetails();
  }

  private listActionRedeploy: IListAction<GitCommit> = {
    action: (commitEntity) => {
      // Seed the deploy wizard's signal-native state so the redeploy
      // page lands on step 3 with everything pre-populated.
      this.deployData.setCfDetails({
        cloudFoundry: this.cfGuid,
        org: this.orgGuid,
        space: this.spaceGuid,
      });
      this.deployData.checkProjectExists(this.scm, this.projectName);
      this.deployData.setSourceType({
        name: this.scm.getLabel(),
        id: this.scm.getType(),
        group: 'gitscm',
        endpointGuid: this.scm.endpointGuid,
      });
      this.deployData.setDeployBranch(this.branchName);
      this.deployData.setDeployCommit(commitEntity.sha);

      this.store.dispatch(new RouterNav({
        path: ['/applications/deploy'],
        query: { appGuid: this.appGuid }
      }));
    },
    label: 'Deploy',
    description: `` };

  private listActionCompare: IListAction<GitCommit> = {
    action: (compareToCommit) => {
      this.getCompareURL(compareToCommit.sha).pipe(take(1)).subscribe(url => window.open(url, '_blank'));
    },
    label: 'Compare',
    description: '',
    createEnabled: (commit$: Observable<GitCommit>) => {
      return commit$.pipe(map(commit => {
        const isDeployedCommit = commit.sha === this.deployedCommitSha;
        if (!isDeployedCommit) {
          // The github url will show 'no change' if the compare to commit is earlier in the tree than the deployed commit. We could swap
          // these around for those cases... however the diff +/- is then incorrect. So until we have a better way of doing this disable
          // the button instead
          return this.deployedTime < getUnixTime(new Date(commit.commit.author.date));
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
  private scmMeta: GitMeta;

  private setGuids() {
    this.applicationService.waitForAppEntity$.pipe(
      combineLatest(this.applicationService.appSpace$),
      take(1),
    ).subscribe(([app, space]) => {
      this.cfGuid = app.entity.entity.cfGuid;
      this.spaceGuid = app.entity.entity.space_guid;
      this.orgGuid = space.orgGuid;
      this.appGuid = app.entity.metadata.guid;
    });
  }

  private setGithubDetails() {
    this.applicationService.applicationStratProject$.pipe(
      take(1),
    ).subscribe(stratosProject => {
      this.projectName = stratosProject.deploySource.project;
      this.deployedCommitSha = stratosProject.deploySource.commit;
      const scmType = stratosProject.deploySource.scm || stratosProject.deploySource.type;
      this.scm = this.scmService.getSCM(scmType as GitSCMType, stratosProject.deploySource.endpointGuid);
      this.scmMeta = {
        scm: this.scm,
        projectName: this.projectName,
        branchName: stratosProject.deploySource.branch
      };

      gitEntityCatalog.branch.store.getEntityService(undefined, undefined, this.scmMeta)
        .waitForEntity$.pipe(
          take(1),
        ).subscribe(branch => {
          this.branchName = branch.entity.name;
          this.dataSource = new GithubCommitsDataSource(
            this.store, this, this.scm, this.projectName, this.branchName, this.deployedCommitSha);
          this.initialised.next(true);
        });

      this.setDeployedCommitDetails();
    });
  }

  private getCompareURL(sha: string): Observable<string> {
    return gitEntityCatalog.repo.store.getRepoInfo.getEntityService(this.scmMeta).waitForEntity$.pipe(
      take(1),
      map(project => this.scm.getCompareCommitURL(project.entity.html_url, this.deployedCommitSha, sha))
    );
  }

  private setDeployedCommitDetails() {
    const scmType = this.scm.getType();
    gitEntityCatalog.commit.store.getEntityMonitor(getCommitGuid(scmType, this.projectName, this.deployedCommitSha)).entity$.pipe(
      filter(deployedCommit => !!deployedCommit),
      take(1),
    ).subscribe(deployedCommit => {
      this.deployedCommit = deployedCommit;
      this.deployedTime = getUnixTime(new Date(this.deployedCommit.commit.author.date));
    });
  }

  public getSingleActions = () => [this.listActionRedeploy, this.listActionCompare];
}
