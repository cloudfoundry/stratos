import { AfterContentInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription,
  timer as observableTimer,
} from 'rxjs';
import { catchError, filter, first, map, pairwise, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import { CFEntityConfig } from '../../../../../../cloud-foundry/cf-types';
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
import { gitBranchesEntityType } from '../../../../../../cloud-foundry/src/cf-entity-factory';
import {
  selectDeployBranchName,
  selectNewProjectCommit,
  selectPEProjectName,
  selectProjectExists,
  selectSourceType,
} from '../../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import { GitAppDetails, SourceType } from '../../../../../../cloud-foundry/src/store/types/deploy-application.types';
import { GitCommit, GitRepo } from '../../../../../../cloud-foundry/src/store/types/git.types';
import { GitBranch } from '../../../../../../cloud-foundry/src/store/types/github.types';
import { EntityServiceFactory } from '../../../../../../core/src/core/entity-service-factory.service';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { GitSCM } from '../../../../../../core/src/shared/data-services/scm/scm';
import { GitSCMService, GitSCMType } from '../../../../../../core/src/shared/data-services/scm/scm.service';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource, EntityInfo } from '../../../../../../store/src/types/api.types';
import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import {
  DEPLOY_TYPES_IDS,
  getApplicationDeploySourceTypes,
  getAutoSelectedDeployType,
} from '../deploy-application-steps.types';

@Component({
  selector: 'app-deploy-application-step2',
  templateUrl: './deploy-application-step2.component.html',
  styleUrls: ['./deploy-application-step2.component.scss']
})
export class DeployApplicationStep2Component
  implements OnInit, OnDestroy, AfterContentInit {

  @Input() isRedeploy = false;

  branchesSubscription: Subscription;
  commitInfo: GitCommit;
  sourceTypes: SourceType[] = getApplicationDeploySourceTypes();
  public DEPLOY_TYPES_IDS = DEPLOY_TYPES_IDS;
  sourceType$: Observable<SourceType>;
  INITIAL_SOURCE_TYPE = 0; // GitHub by default
  repositoryBranches$: Observable<any>;
  validate: Observable<boolean>;
  projectInfo$: Observable<GitRepo>;
  commitSubscription: Subscription;

  // ngModel Properties
  sourceType: SourceType;
  repositoryBranch: GitBranch = { name: null, commit: null };
  repository: string;
  stepperText = 'Please specify the source';

  // Git URL
  gitUrl: string;
  gitUrlBranchName: string;

  // Observables for source types
  sourceTypeGithub$: Observable<boolean>;
  sourceTypeNeedsUpload$: Observable<boolean>;

  scm: GitSCM;

  // We don't have any repositories to suggest initially - need user to start typing
  suggestedRepos$: Observable<string[]>;

  cachedSuggestions = {};

  // Local FS data when file or folder upload
  // @Input('fsSourceData') fsSourceData;

  @ViewChild('sourceSelectionForm') sourceSelectionForm: NgForm;
  subscriptions: Array<Subscription> = [];

  @ViewChild('fsChooser') fsChooser;
  public selectedSourceType: SourceType = null;

  ngOnDestroy(): void {
    this.subscriptions.forEach(p => p.unsubscribe());
    if (this.commitSubscription) {
      this.commitSubscription.unsubscribe();
    }
    if (this.branchesSubscription) {
      this.branchesSubscription.unsubscribe();
    }
  }

  constructor(
    private entityServiceFactory: EntityServiceFactory,
    private store: Store<CFAppState>,
    route: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private scmService: GitSCMService
  ) {
    this.selectedSourceType = getAutoSelectedDeployType(route);
    if (this.selectedSourceType) {
      this.stepperText = this.selectedSourceType.helpText;
    }
  }

  onNext: StepOnNextFunction = () => {
    // Set the details based on which source type is selected
    let details: GitAppDetails;
    if (this.sourceType.group === 'gitscm') {
      details = {
        projectName: this.repository,
        branch: this.repositoryBranch,
        url: this.scm.getCloneURL(this.repository)
      };
    } else if (this.sourceType.id === DEPLOY_TYPES_IDS.GIT_URL) {
      details = {
        projectName: this.gitUrl,
        branch: {
          name: this.gitUrlBranchName
        }
      };
    }

    this.store.dispatch(new SaveAppDetails(details));
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

    const fetchBranches = this.store
      .select(selectProjectExists)
      .pipe(
        filter(state => state && !state.checking && !state.error && state.exists),
        tap(state => {
          if (this.branchesSubscription) {
            this.branchesSubscription.unsubscribe();
          }
          const fetchBranchesAction = new FetchBranchesForProject(this.scm, state.name);
          this.branchesSubscription = getPaginationObservables<APIResource>(
            {
              store: this.store,
              action: fetchBranchesAction,
              paginationMonitor: this.paginationMonitorFactory.create(
                fetchBranchesAction.paginationKey,
                new CFEntityConfig(gitBranchesEntityType)
              )
            },
            true
          ).entities$.subscribe();
        })
      )
      .subscribe();

    this.subscriptions.push(fetchBranches);

    const paginationAction = {
      entityType: gitBranchesEntityType,
      paginationKey: 'branches'
    } as PaginatedAction;
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

    const paginationMonitor = this.paginationMonitorFactory.create<APIResource<GitBranch>>(
      paginationAction.paginationKey,
      new CFEntityConfig(gitBranchesEntityType)
    );

    this.repositoryBranches$ = paginationMonitor.currentPage$.pipe(
      map(branches => branches.map(branch => branch.entity)),
      withLatestFrom(deployBranchName$),
      filter(([branches, branchName]) => !!branchName),
      tap(([branches, branchName]) => {
        this.repositoryBranch = branches.find(
          branch => branch.name === branchName
        );
      }),
      map(([p, q]) => p)
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
          const commitEntityService = this.entityServiceFactory.create<EntityInfo>(
            entityID,
            new FetchCommit(this.scm, commitSha, projectInfo.full_name),
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
            this.store.dispatch(new SaveAppDetails({ projectName: '', branch: null }));
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

    this.subscriptions.push(setInitialSourceType$.subscribe());
    this.subscriptions.push(setSourceTypeModel$.subscribe());
    this.subscriptions.push(setProjectName.subscribe());

    this.suggestedRepos$ = this.sourceSelectionForm.valueChanges.pipe(
      map(form => form.projectName),
      startWith(''),
      pairwise(),
      filter(([oldName, newName]) => oldName !== newName),
      switchMap(([oldName, newName]) => this.updateSuggestedRepositories(newName))
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
      switchMap(() => this.scm.getMatchingRepositories(name)),
      catchError(e => observableOf(null)),
      tap(suggestions => this.cachedSuggestions[cacheName] = suggestions)
    );
  }

  setSourceType = (sourceType: SourceType) => this.store.dispatch(new SetAppSourceDetails(sourceType));

  updateBranchName(branch: GitBranch) {
    this.store.dispatch(new SetDeployBranch(branch.name));
  }

  ngAfterContentInit() {
    this.validate = this.sourceSelectionForm.statusChanges.pipe(map(() => {
      return this.sourceSelectionForm.valid || this.isRedeploy;
    }));
  }
}
