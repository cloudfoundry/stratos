import { HttpClient } from '@angular/common/http';
import { AfterContentInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  combineLatest as observableCombineLatest,
  combineLatest,
  Observable,
  of as observableOf,
  Subscription,
  timer as observableTimer,
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
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

import { CF_ENDPOINT_TYPE, CFEntityConfig } from '../../../../cf-types';
import {
  FetchBranchesForProject,
  FetchCommit,
  ProjectDoesntExist,
  SaveAppDetails,
  SetAppSourceDetails,
  SetBranch,
  SetDeployBranch,
} from '../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { gitBranchesEntityType, gitCommitEntityType } from '../../../../../../cloud-foundry/src/cf-entity-types';
import {
  selectDeployAppState,
  selectDeployBranchName,
  selectNewProjectCommit,
  selectPEProjectName,
  selectProjectExists,
  selectSourceType,
} from '../../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import {
  DeployApplicationState,
  SourceType,
} from '../../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { GitCommit, GitRepo } from '../../../../../../cloud-foundry/src/store/types/git.types';
import { GitBranch } from '../../../../../../cloud-foundry/src/store/types/github.types';
import { entityCatalog } from '../../../../../../store/src/entity-catalog/entity-catalog.service';
import { EntityServiceFactory } from '../../../../../../store/src/entity-service-factory.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { GitSCM } from '../../../../../../core/src/shared/data-services/scm/scm';
import { GitSCMService, GitSCMType } from '../../../../../../core/src/shared/data-services/scm/scm.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { EntityInfo } from '../../../../../../store/src/types/api.types';
import { ApplicationDeploySourceTypes, DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';

@Component({
  selector: 'app-deploy-application-step2',
  templateUrl: './deploy-application-step2.component.html',
  styleUrls: ['./deploy-application-step2.component.scss']
})
export class DeployApplicationStep2Component
  implements OnInit, OnDestroy, AfterContentInit {

  @Input() isRedeploy = false;

  commitInfo: GitCommit;
  sourceTypes: SourceType[];
  public DEPLOY_TYPES_IDS = DEPLOY_TYPES_IDS;
  sourceType$: Observable<SourceType>;
  INITIAL_SOURCE_TYPE = 0; // GitHub by default
  validate: Observable<boolean>;

  stepperText = 'Please specify the source';

  // Observables for source types
  sourceTypeGithub$: Observable<boolean>;
  sourceTypeNeedsUpload$: Observable<boolean>;
  // tslint:disable-next-line:ban-types
  canDeployType$: Observable<Boolean>;
  isLoading$: Observable<boolean>;

  // Local FS data when file or folder upload
  // @Input('fsSourceData') fsSourceData;

  // ---- GIT ----------
  repositoryBranches$: Observable<any>;

  projectInfo$: Observable<GitRepo>;
  commitSubscription: Subscription;

  sourceType: SourceType;
  repositoryBranch: GitBranch = { name: null, commit: null };
  repository: string;

  scm: GitSCM;

  cachedSuggestions = {};

  // We don't have any repositories to suggest initially - need user to start typing
  suggestedRepos$: Observable<string[]>;

  // Git URL
  gitUrl: string;
  gitUrlBranchName: string;
  // --------------

  // ---- Docker ----------
  dockerAppName: string;
  dockerImg: string;
  dockerUsername: string;
  // --------------

  @ViewChild('sourceSelectionForm', { static: true }) sourceSelectionForm: NgForm;
  subscriptions: Array<Subscription> = [];

  @ViewChild('fsChooser', { static: false }) fsChooser;

  public selectedSourceType: SourceType = null;

  ngOnDestroy() {
    this.subscriptions.forEach(p => p.unsubscribe());
    if (this.commitSubscription) {
      this.commitSubscription.unsubscribe();
    }
  }

  constructor(
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<CFAppState>,
    route: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private scmService: GitSCMService,
    private httpClient: HttpClient,
    private appDeploySourceTypes: ApplicationDeploySourceTypes
  ) {
    this.sourceTypes = appDeploySourceTypes.getTypes();
    this.selectedSourceType = appDeploySourceTypes.getAutoSelectedType(route);
    if (this.selectedSourceType) {
      this.stepperText = this.selectedSourceType.helpText;
    }
  }

  onNext: StepOnNextFunction = () => {
    // Set the details based on which source type is selected
    if (this.sourceType.group === 'gitscm') {
      this.store.dispatch(new SaveAppDetails({
        projectName: this.repository,
        branch: this.repositoryBranch,
        url: this.scm.getCloneURL(this.repository)
      }, null));
    } else if (this.sourceType.id === DEPLOY_TYPES_IDS.GIT_URL) {
      this.store.dispatch(new SaveAppDetails({
        projectName: this.gitUrl,
        branch: {
          name: this.gitUrlBranchName
        }
      }, null));
    } else if (this.sourceType.id === DEPLOY_TYPES_IDS.DOCKER_IMG) {
      this.store.dispatch(new SaveAppDetails(null, {
        applicationName: this.dockerAppName,
        dockerImage: this.dockerImg,
        dockerUsername: this.dockerUsername,
      }));
    }
    return observableOf({ success: true, data: this.sourceSelectionForm.form.value.fsLocalSource });
  }

  ngOnInit() {
    if (this.isRedeploy) {
      this.stepperText = 'Review source details';
    }

    this.sourceType$ = this.store.select(selectSourceType);

    this.sourceTypeGithub$ = this.sourceType$.pipe(
      filter(type => type && !!type.id),
      map(type => type.group === 'gitscm')
    );

    this.sourceTypeNeedsUpload$ = this.sourceType$.pipe(
      filter(type => type && !!type.id),
      map(type => type.id === DEPLOY_TYPES_IDS.FOLDER || type.id === DEPLOY_TYPES_IDS.FILE)
    );

    const setInitialSourceType$ = this.store.select(selectSourceType).pipe(
      filter(p => !p),
      first(),
      tap(p => {
        this.setSourceType(this.selectedSourceType || this.sourceTypes[this.INITIAL_SOURCE_TYPE]);
        if (this.selectedSourceType) {
          this.sourceType = this.selectedSourceType;
        }
      })
    );

    const cfGuid$ = this.store.select(selectDeployAppState).pipe(
      filter((appDetail: DeployApplicationState) => !!appDetail.cloudFoundryDetails),
      map((appDetail: DeployApplicationState) => appDetail.cloudFoundryDetails.cloudFoundry)
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

    this.subscriptions.push(setInitialSourceType$.subscribe());
  }

  setSourceType = (sourceType: SourceType) => {
    if (sourceType.group === 'gitscm' || sourceType.id === DEPLOY_TYPES_IDS.GIT_URL) {
      this.setupForGit();
    }

    this.store.dispatch(new SetAppSourceDetails(sourceType));
  }

  ngAfterContentInit() {
    this.validate = this.sourceSelectionForm.statusChanges.pipe(map(() => {
      return this.sourceSelectionForm.valid || this.isRedeploy;
    }));
  }

  /* Git ------------------*/
  private setupForGit() {
    this.projectInfo$ = this.store.select(selectProjectExists).pipe(
      filter(p => !!p),
      map(p => (!!p.exists && !!p.data) ? p.data : null),
      tap(p => {
        if (!!p && !this.isRedeploy) {
          this.store.dispatch(new SetDeployBranch(p.default_branch));
        }
      })
    );

    const deployBranchName$ = this.store.select(selectDeployBranchName);
    const deployCommit$ = this.store.select(selectNewProjectCommit);

    this.repositoryBranches$ = this.store
      .select(selectProjectExists)
      .pipe(
        // Wait for a new project name change
        filter(state => state && !state.checking && !state.error && state.exists),
        distinctUntilChanged((x, y) => x.name === y.name),
        // Convert project name into branches pagination observable
        switchMap(state => {
          const fetchBranchesAction = new FetchBranchesForProject(this.scm, state.name);
          return getPaginationObservables<GitBranch>(
            {
              store: this.store,
              action: fetchBranchesAction,
              paginationMonitor: this.paginationMonitorFactory.create(
                fetchBranchesAction.paginationKey,
                new CFEntityConfig(gitBranchesEntityType)
              )
            },
            true
          ).entities$;
        }),
        // Find the specific branch we're interested inS
        withLatestFrom(deployBranchName$),
        filter(([, branchName]) => !!branchName),
        tap(([branches, branchName]) => {
          this.repositoryBranch = branches.find(
            branch => branch.name === branchName
          );
        }),
        map(([p, q]) => p),
        publishReplay(1),
        refCount()
      );

    const updateBranchAndCommit = observableCombineLatest(
      this.repositoryBranches$,
      deployBranchName$,
      this.projectInfo$,
      deployCommit$
    ).pipe(
      tap(([branches, name, projectInfo, commit]) => {
        const branch = branches.find(b => b.name === name);
        if (branch && !!projectInfo && branch.projectId === projectInfo.full_name) {
          this.store.dispatch(new SetBranch(branch));
          const commitSha = commit || branch.commit.sha;
          const entityID = projectInfo.full_name + '-' + commitSha;
          const gitCommitEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, gitCommitEntityType);
          const fetchCommitActionBuilder = gitCommitEntity.actionOrchestrator.getActionBuilder('get');
          const fetchCommitAction = fetchCommitActionBuilder(null, null, {
            scm: this.scm,
            projectName: projectInfo.full_name,
            commitId: commitSha
          }) as FetchCommit;
          const commitEntityService = this.entityServiceFactory.create<EntityInfo>(
            entityID,
            fetchCommitAction
          );

          if (this.commitSubscription) {
            this.commitSubscription.unsubscribe();
          }
          this.commitSubscription = commitEntityService.waitForEntity$.pipe(
            map(p => p.entity.entity),
            tap(p => this.commitInfo = p)
          ).subscribe();
        }
      })
    );

    this.subscriptions.push(updateBranchAndCommit.subscribe());

    const setSourceTypeModel$ = this.store.select(selectSourceType).pipe(
      filter(p => !!p),
      tap(p => {
        this.sourceType = this.sourceTypes.find(s => s.id === p.id);

        const newScm = this.scmService.getSCM(this.sourceType.id as GitSCMType);
        if (!!newScm) {
          // User selected one of the SCM options
          if (this.scm && newScm.getType() !== this.scm.getType()) {
            // User changed the SCM type, so reset the project and branch
            this.repository = null;
            this.commitInfo = null;
            this.repositoryBranch = null;
            this.store.dispatch(new SetBranch(null));
            this.store.dispatch(new ProjectDoesntExist(''));
            this.store.dispatch(new SaveAppDetails({ projectName: '', branch: null }, null));
          }
          this.scm = newScm;
        }
      })
    );

    const setProjectName = this.store.select(selectPEProjectName).pipe(
      filter(p => !!p),
      take(1),
      tap(p => {
        this.repository = p;
      })
    );

    this.subscriptions.push(setSourceTypeModel$.subscribe());
    this.subscriptions.push(setProjectName.subscribe());

    this.suggestedRepos$ = this.sourceSelectionForm.valueChanges.pipe(
      map(form => form.projectName),
      startWith(''),
      pairwise(),
      filter(([oldName, newName]) => oldName !== newName),
      switchMap(([, newName]) => this.updateSuggestedRepositories(newName))
    );
  }

  updateSuggestedRepositories(name: string): Observable<string[]> {
    if (!name || name.length < 3) {
      return observableOf([] as string[]);
    }

    const cacheName = this.scm.getType() + ':' + name;
    if (this.cachedSuggestions[cacheName]) {
      return observableOf(this.cachedSuggestions[cacheName]);
    }

    return observableTimer(500).pipe(
      take(1),
      switchMap(() => this.scm.getMatchingRepositories(this.httpClient, name)),
      catchError(e => observableOf(null)),
      tap(suggestions => this.cachedSuggestions[cacheName] = suggestions)
    );
  }

  updateBranchName(branch: GitBranch) {
    this.store.dispatch(new SetDeployBranch(branch.name));
  }


}
