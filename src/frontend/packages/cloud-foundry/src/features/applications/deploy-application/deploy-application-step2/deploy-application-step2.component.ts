import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterContentInit, Component, Input, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  BaseSCM,
  GitBranch,
  GitCommit,
  gitEntityCatalog,
  GitHubSCM,
  GitRepo,
  GitSCM,
  GitSCMService,
  GitSCMType,
} from '@stratosui/git';
import {
  combineLatest,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  of,
  Subscription,
  timer as observableTimer,
} from 'rxjs';
import {
  catchError,
  defaultIfEmpty,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { CfDeployAppDataService } from '../../../../services/domain-data/cf-deploy-app-data.service';
import { TruncatePipe } from '../../../../../../core/src/core/truncate.pipe';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { getCommitGuid } from '../../../../../../git/src/store/git-entity-factory';
import { DeployApplicationState, SourceType } from '../../../../store/types/deploy-application.types';
import { ApplicationDeploySourceTypes, DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';
import { GitSuggestedRepo } from './../../../../../../git/src/store/git.public-types';
import { GithubProjectExistsDirective } from '../github-project-exists.directive';
import { DeployApplicationFsComponent } from './deploy-application-fs/deploy-application-fs.component';



@Component({
selector: 'app-deploy-application-step2',
  templateUrl: './deploy-application-step2.component.html',
  styleUrls: ['./deploy-application-step2.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    TruncatePipe,
    GithubProjectExistsDirective,
    DeployApplicationFsComponent
  ]
})
export class DeployApplicationStep2Component
  implements OnInit, OnDestroy, AfterContentInit {
  private route = inject(ActivatedRoute);
  private scmService = inject(GitSCMService);
  private httpClient = inject(HttpClient);
  private appDeploySourceTypes = inject(ApplicationDeploySourceTypes);
  private deployData = inject(CfDeployAppDataService);
  private deployState$ = toObservable(this.deployData.state);
  private sourceType$$ = toObservable(this.deployData.sourceType);
  private projectExists$ = toObservable(this.deployData.projectExists);
  private deployBranchName$ = toObservable(this.deployData.deployBranchName);
  private deployCommit$ = toObservable(this.deployData.newProjectCommit);
  private peProjectName$ = toObservable(this.deployData.projectName);


  @Input() isRedeploy = false;

  commitInfo: GitCommit;
  public DEPLOY_TYPES_IDS = DEPLOY_TYPES_IDS;
  sourceType$!: Observable<SourceType>;
  INITIAL_SOURCE_TYPE = 0; // Fall back to GitHub, for cases where there's no type in store (refresh) or url (removed & nav)
  validate!: Observable<boolean>;

  stepperText$!: Observable<string>;

  // Observables for source types
  sourceTypeGithub$!: Observable<boolean>;
  sourceTypeNeedsUpload$!: Observable<boolean>;
  // tslint:disable-next-line:ban-types
  canDeployType$!: Observable<boolean>;
  isLoading$!: Observable<boolean>;

  // Local FS data when file or folder upload
  // @Input('fsSourceData') fsSourceData;

  // ---- GIT ----------
  repositoryBranches$!: Observable<GitBranch[]>;

  projectInfo$!: Observable<GitRepo>;
  commitSubscription!: Subscription;

  sourceType: SourceType;
  repositoryBranch: GitBranch = null;
  repository: string;

  scm: GitSCM;

  cachedSuggestions = {};

  // We don't have any repositories to suggest initially - need user to start typing
  suggestedRepos$!: Observable<GitSuggestedRepo[]>;

  // GitHub Enterprise / private repo support
  isInvalidGithubEnterpriseUrl = false;
  githubEnterpriseUrl: string;
  accessToken: string;
  // --------------

  // Git URL
  gitUrl!: string;
  gitUrlBranchName!: string;
  // --------------

  // ---- Docker ----------
  dockerAppName: string;
  dockerImg: string;
  dockerUsername: string;
  // --------------

  @ViewChild('sourceSelectionForm', { static: true }) sourceSelectionForm: NgForm;
  subscriptions: Array<Subscription> = [];

  @ViewChild('fsChooser') fsChooser: any;

  ngOnDestroy() {
    this.subscriptions.forEach(p => p.unsubscribe());
    if (this.commitSubscription) {
      this.commitSubscription.unsubscribe();
    }
  }

  onNext: StepOnNextFunction = () => {
    // Set the details based on which source type is selected
    if (this.sourceType.group === 'gitscm') {
      gitEntityCatalog.repo.store.getRepoInfo.getEntityService({
        projectName: this.repository,
        scm: this.scm,
      }).waitForEntity$.pipe(take(1), defaultIfEmpty(null)).subscribe(repo => {
        if (!repo) { return; }
        this.deployData.saveAppDetails({
          projectName: this.repository,
          branch: this.repositoryBranch,
          url: repo.entity.clone_url,
          accessToken: this.accessToken,
          commit: this.isRedeploy ? this.commitInfo.sha : undefined,
          endpointGuid: this.sourceType.endpointGuid,
        }, null);
      });
    } else if (this.sourceType.id === DEPLOY_TYPES_IDS.GIT_URL) {
      this.deployData.saveAppDetails({
        projectName: this.gitUrl,
        branch: {
          name: this.gitUrlBranchName,
          guid: null,
          projectName: null,
          scmType: null,
          endpointGuid: null,
        },
        endpointGuid: null
      }, null);
    } else if (this.sourceType.id === DEPLOY_TYPES_IDS.DOCKER_IMG) {
      this.deployData.saveAppDetails(null, {
        applicationName: this.dockerAppName,
        dockerImage: this.dockerImg,
        dockerUsername: this.dockerUsername,
      });
    }
    return observableOf({ success: true, data: this.sourceSelectionForm.form.value.fsLocalSource });
  };

  ngOnInit() {
    this.sourceType$ = combineLatest(
      this.appDeploySourceTypes.getAutoSelectedType(this.route),
      this.sourceType$$,
      this.appDeploySourceTypes.types$.pipe(take(1), map(st => st[this.INITIAL_SOURCE_TYPE]))
    ).pipe(
      map(([sourceFromParam, sourceFromStore, sourceDefault]) => sourceFromParam || sourceFromStore || sourceDefault),
      filter(sourceType => !!sourceType),
    );

    this.sourceTypeGithub$ = this.sourceType$.pipe(
      filter(type => type && !!type.id),
      map(type => type.group === 'gitscm')
    );

    this.sourceTypeNeedsUpload$ = this.sourceType$.pipe(
      filter(type => type && !!type.id),
      map(type => type.id === DEPLOY_TYPES_IDS.FOLDER || type.id === DEPLOY_TYPES_IDS.FILE)
    );


    const setInitialSourceType$ = this.sourceType$.pipe(
      take(1),
      tap(sourceType => {
        this.setSourceType(sourceType);
        this.sourceType = sourceType;
      })
    );

    const cfGuid$ = this.deployState$.pipe(
      filter((appDetail): appDetail is DeployApplicationState => !!appDetail && !!appDetail.cloudFoundryDetails),
      map(appDetail => appDetail.cloudFoundryDetails.cloudFoundry)
    );

    this.canDeployType$ = combineLatest([
      cfGuid$,
      this.sourceType$
    ]).pipe(
      filter(([cfGuid, sourceType]) => !!cfGuid && !!sourceType),
      switchMap(([cfGuid, sourceType]) => this.appDeploySourceTypes.canDeployType(cfGuid, sourceType.id)),
      publishReplay(1),
      refCount()
    );

    this.stepperText$ = this.canDeployType$.pipe(
      switchMap(canDeployType => canDeployType ?
        this.isRedeploy ? of('Review source details') : this.sourceType$.pipe(map(st => st.helpText)) :
        of(null)
      )
    );

    this.subscriptions.push(setInitialSourceType$.subscribe());
  }

  setSourceType = (sourceType: SourceType) => {
    if (sourceType.group === 'gitscm' || sourceType.id === DEPLOY_TYPES_IDS.GIT_URL) {
      this.setupForGit();
    }

    this.deployData.setSourceType(sourceType);
  };

  ngAfterContentInit() {
    this.validate = this.sourceSelectionForm.statusChanges.pipe(map(() => {
      return this.sourceSelectionForm.valid || this.isRedeploy;
    }));
  }

  /* Git ------------------*/
  private setupForGit() {
    this.projectInfo$ = this.projectExists$.pipe(
      filter(p => !!p),
      map(p => (!!p.exists && !!p.data) ? p.data : null),
      tap(p => {
        if (!!p && !this.isRedeploy) {
          this.deployData.setDeployBranch(p.default_branch);
        }
      })
    );

    const deployBranchName$ = this.deployBranchName$;
    const deployCommit$ = this.deployCommit$;

    this.repositoryBranches$ = this.projectExists$
      .pipe(
        // Wait for a new project name change
        filter(state => state && !state.checking && !state.error && state.exists),
        distinctUntilChanged((x, y) => x.name.toLowerCase() === y.name.toLowerCase()),
        // Convert project name into branches pagination observable
        switchMap(state =>
          gitEntityCatalog.branch.store.getPaginationService(null, null, {
            scm: this.scm,
            projectName: state.name
          }).entities$
        ),
        // Find the specific branch we're interested in
        withLatestFrom(deployBranchName$),
        filter(([, branchName]) => !!branchName),
        tap(([branches, branchName]) => {
          this.repositoryBranch = branches.find(
            branch => branch.name === branchName
          );
        }),
        map(([branches, _branchName]) => branches),
        publishReplay(1),
        refCount()
      );

    const updateBranchAndCommit = observableCombineLatest(
      this.repositoryBranches$,
      deployBranchName$,
      this.projectInfo$,
      deployCommit$,
    ).pipe(
      tap(([branches, name, projectInfo, commit]) => {
        const branch = branches.find(b => b.name === name);
        if (branch && !!projectInfo && branch.projectName === projectInfo.full_name) {
          this.deployData.setBranch(branch);

          if (this.isRedeploy) {
            const commitSha = commit || branch.commit.sha;
            const commitGuid = getCommitGuid(this.scm.getType(), projectInfo.full_name, commitSha);
            const commitEntityService = gitEntityCatalog.commit.store.getEntityService(commitGuid, null, {
              projectName: projectInfo.full_name,
              scm: this.scm, commitSha
            });

            if (this.commitSubscription) {
              this.commitSubscription.unsubscribe();
            }
            this.commitSubscription = commitEntityService.waitForEntity$.pipe(
              take(1),
              map(p => p.entity),
              tap(p => this.commitInfo = p),
            ).subscribe();
          }
        }
      })
    );

    this.subscriptions.push(updateBranchAndCommit.subscribe());

    const setSourceTypeModel$ = this.sourceType$$.pipe(
      filter(p => !!p),
      withLatestFrom(this.appDeploySourceTypes.types$),
      tap(([p, sourceTypes]) => {
        this.sourceType = sourceTypes.find(s => s.id === p.id && (p.endpointGuid ? s.endpointGuid === p.endpointGuid : true));

        const newScm = this.scmService.getSCM(this.sourceType.id as GitSCMType, this.sourceType.endpointGuid);
        if (newScm) {
          // User selected one of the SCM options
          if (this.scm && newScm.getType() !== this.scm.getType()) {
            // User changed the SCM type, so reset the project and branch
            this.repository = null;
            this.commitInfo = null;
            this.repositoryBranch = null;
            this.deployData.setBranch(null);
            this.deployData.projectDoesntExist('');
            this.deployData.saveAppDetails({ projectName: '', branch: null, endpointGuid: this.sourceType.endpointGuid }, null);
          }
          this.scm = newScm;
        }
      })
    );

    const setProjectName = this.peProjectName$.pipe(
      filter(p => !!p),
      take(1),
      tap(p => {
        this.repository = p;
      })
    );

    this.subscriptions.push(setSourceTypeModel$.subscribe());
    this.subscriptions.push(setProjectName.subscribe());

    this.suggestedRepos$ = this.sourceSelectionForm.valueChanges.pipe(
      tap(form => {
        this.applyGithubEnterpriseAndToken(form?.githubEnterpriseUrl, form?.githubAccessToken);
      }),
      map(form => form.projectName),
      startWith(''),
      pairwise(),
      filter(([oldName, newName]) => oldName !== newName),
      switchMap(([, newName]) => this.updateSuggestedRepositories(newName))
    );
  }

  // Forwards the two optional inputs (GHE base URL, GitHub PAT) into the
  // active GitHubSCM instance so that subsequent repo/branch/commit API calls
  // target the right host with the right Authorization header. Silent no-op
  // when the active SCM is not GitHub (e.g. GitLab selected).
  private applyGithubEnterpriseAndToken(enterpriseUrl: string | undefined, token: string | undefined) {
    if (!this.scm) {
      return;
    }
    const isValidUrl = (input: string) => {
      try {
        return Boolean(new URL(input));
      } catch {
        return false;
      }
    };

    this.isInvalidGithubEnterpriseUrl = !!enterpriseUrl && !isValidUrl(enterpriseUrl);

    if (enterpriseUrl && !this.isInvalidGithubEnterpriseUrl) {
      (this.scm as unknown as BaseSCM).setPublicApi(enterpriseUrl);
    }

    if (this.scm.getType() === 'github') {
      if (token) {
        (this.scm as GitHubSCM).setAccessToken(token);
      } else {
        (this.scm as GitHubSCM).clearAccessToken();
      }
    }
  }

  updateSuggestedRepositories(name: string): Observable<GitSuggestedRepo[]> {
    if (!name || name.length < 3) {
      return observableOf([] as GitSuggestedRepo[]);
    }

    const cacheName = this.scm.getType() + ':' + name;
    if ((this.cachedSuggestions as { [key: string]: any })[cacheName]) {
      return observableOf((this.cachedSuggestions as { [key: string]: any })[cacheName]);
    }

    return observableTimer(500).pipe(
      take(1),
      switchMap(() => this.scm.getMatchingRepositories(this.httpClient, name)),
      catchError(_e => observableOf(null)),
      tap(suggestions => (this.cachedSuggestions as { [key: string]: any })[cacheName] = suggestions),
    );
  }

  updateBranchName(branch: GitBranch) {
    this.deployData.setDeployBranch(branch.name);
  }


}
