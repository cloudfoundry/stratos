import { AfterContentInit, Component, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, timer as observableTimer, of as observableOf, Subscription } from 'rxjs';
import { filter, map, take, tap, withLatestFrom, switchMap } from 'rxjs/operators';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import {
  FetchBranchesForProject,
  FetchCommit,
  SaveAppDetails,
  SetAppSourceDetails,
  SetBranch,
  SetDeployBranch,
  ProjectDoesntExist,
} from '../../../../store/actions/deploy-applications.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, gitBranchesSchemaKey, gitCommitSchemaKey } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  selectDeployBranchName,
  selectNewProjectCommit,
  selectPEProjectName,
  selectProjectExists,
  selectSourceType,
} from '../../../../store/selectors/deploy-application.selector';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { GitAppDetails, SourceType } from '../../../../store/types/deploy-application.types';
import { GitBranch, GitCommit, GitRepo } from '../../../../store/types/git.types';
import { PaginatedAction } from '../../../../store/types/pagination.types';
import { GitSCMService, GitSCMType } from '../../../../shared/data-services/scm/scm.service';
import { GitSCM } from '../../../../shared/data-services/scm/scm';

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
  sourceTypes: SourceType[] = [
    { name: 'Public GitHub', id: 'github', group: 'gitscm' },
    { name: 'Public GitLab', id: 'gitlab', group: 'gitscm' },
    { name: 'Public Git URL', id: 'giturl' },
    { name: 'Application Archive File', id: 'file' },
    { name: 'Application Folder', id: 'folder' },
  ];
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

  lastProjectName: string = null;

  @ViewChild('sourceSelectionForm') sourceSelectionForm: NgForm;
  subscriptions: Array<Subscription> = [];

  @ViewChild('fsChooser') fsChooser;

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
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private scmService: GitSCMService
  ) { }

  onNext: StepOnNextFunction = () => {
    // Set the details based on which source type is selected
    let details: GitAppDetails;
    if (this.sourceType.group === 'gitscm') {
      details = {
        projectName: this.repository,
        branch: this.repositoryBranch,
        url: this.scm.getCloneURL(this.repository)
      };
    } else if (this.sourceType.id === 'giturl') {
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
      map(type => type.id === 'folder' || type.id === 'file')
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
                entityFactory(gitBranchesSchemaKey)
              )
            },
            true
          ).entities$.subscribe();
        })
      )
      .subscribe();

    this.subscriptions.push(fetchBranches);

    const paginationAction = {
      entityKey: gitBranchesSchemaKey,
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
      entityFactory(gitBranchesSchemaKey)
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
          const entityKey = projectInfo.full_name + '-' + commitSha;
          const commitEntityService = this.entityServiceFactory.create<EntityInfo>(
            gitCommitSchemaKey,
            entityFactory(gitCommitSchemaKey),
            entityKey,
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
      take(1),
      tap(p => {
        this.setSourceType(this.sourceTypes[this.INITIAL_SOURCE_TYPE]);
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

    this.subscriptions.push(this.sourceSelectionForm.valueChanges.subscribe(form => {
      if (form.projectName !== this.lastProjectName) {
        // Go and fetch the matching list of repositories and make that the auto-complete list
        this.suggestedRepos$ = this.updateSuggestedRepositories(form.projectName);
      }
      this.lastProjectName = form.projectName;
    }));
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
      switchMap(() => this.scm.getMacthingRepositories(name)),
      tap(suggestions => this.cachedSuggestions[cacheName] = suggestions)
    );
  }

  setSourceType = event => this.store.dispatch(new SetAppSourceDetails(event));

  updateBranchName(branch: GitBranch) {
    this.store.dispatch(new SetDeployBranch(branch.name));
  }

  ngAfterContentInit() {
    this.validate = this.sourceSelectionForm.statusChanges.pipe(map(() => {
      return this.sourceSelectionForm.valid || this.isRedeploy;
    }));
  }
}
