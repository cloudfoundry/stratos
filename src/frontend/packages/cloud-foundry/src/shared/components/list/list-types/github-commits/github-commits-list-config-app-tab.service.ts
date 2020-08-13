import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { combineLatest, filter, first, map } from 'rxjs/operators';

import {
  CheckProjectExists,
  SetAppSourceDetails,
  SetDeployBranch,
  SetDeployCommit,
  StoreCFSettings,
} from '../../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { cfEntityCatalog } from '../../../../../../../cloud-foundry/src/cf-entity-catalog';
import { gitCommitEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { ApplicationService } from '../../../../../../../cloud-foundry/src/features/applications/application.service';
import { selectCfEntity } from '../../../../../../../cloud-foundry/src/store/selectors/api.selectors';
import { GitCommit } from '../../../../../../../cloud-foundry/src/store/types/git.types';
import { IListAction } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { GitSCM } from '../../../../data-services/scm/scm';
import { GitSCMService, GitSCMType } from '../../../../data-services/scm/scm.service';
import { GithubCommitsDataSource } from './github-commits-data-source';
import { GithubCommitsListConfigServiceBase } from './github-commits-list-config-base.service';


@Injectable()
export class GithubCommitsListConfigServiceAppTab extends GithubCommitsListConfigServiceBase {

  private listActionRedeploy: IListAction<GitCommit> = {
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
      this.store.dispatch(new SetDeployCommit(commitEntity.sha));

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

  private listActionCompare: IListAction<GitCommit> = {
    action: (compareToCommit) => {
      window.open(this.getCompareURL(compareToCommit.sha), '_blank');
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
          return this.deployedTime < moment(commit.commit.author.date).unix();
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
    store: Store<CFAppState>,
    datePipe: DatePipe,
    private scmService: GitSCMService,
    private applicationService: ApplicationService,
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

      cfEntityCatalog.gitBranch.store.getEntityService(undefined, undefined, {
        scm: this.scm,
        projectName: this.projectName,
        branchName: stratosProject.deploySource.branch
      })
        .waitForEntity$.pipe(
          first(),
        ).subscribe(branch => {
          this.branchName = branch.entity.name;
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
    const scmType = this.scm.getType();
    this.store.select(
      selectCfEntity<GitCommit>(gitCommitEntityType, scmType + '-' + this.projectName + '-' + this.deployedCommitSha))
      .pipe(
        filter(deployedCommit => !!deployedCommit),
        first(),
      ).subscribe(deployedCommit => {
        this.deployedCommit = deployedCommit;
        this.deployedTime = moment(this.deployedCommit.commit.author.date).unix();
      });
  }

  public getSingleActions = () => [this.listActionRedeploy, this.listActionCompare];
}
