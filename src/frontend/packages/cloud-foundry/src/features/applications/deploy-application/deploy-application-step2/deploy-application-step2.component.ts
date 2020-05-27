import { HttpClient } from '@angular/common/http';
import { AfterContentInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
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

import {
  ProjectDoesntExist,
  SaveAppDetails,
  SetAppSourceDetails,
  SetBranch,
  SetDeployBranch,
} from '../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  selectDeployAppState,
  selectDeployBranchName,
  selectNewProjectCommit,
  selectPEProjectName,
  selectProjectExists,
  selectSourceType,
} from '../../../../../../cloud-foundry/src/store/selectors/deploy-application.selector';
import { StepOnNextFunction } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { GitSCM } from '../../../../shared/data-services/scm/scm';
import { GitSCMService, GitSCMType } from '../../../../shared/data-services/scm/scm.service';
import { DeployApplicationState, SourceType } from '../../../../store/types/deploy-application.types';
import { GitBranch, GitCommit, GitRepo } from '../../../../store/types/git.types';
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
  INITIAL_SOURCE_TYPE = 0; // Fall back to GitHub, for cases where there's no type in store (refresh) or url (removed & nav)
  validate: Observable<boolean>;

  stepperText$: Observable<string>;

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

  @ViewChild('fsChooser') fsChooser;

  ngOnDestroy() {
    this.subscriptions.forEach(p => p.unsubscribe());
    if (this.commitSubscription) {
      this.commitSubscription.unsubscribe();
    }
  }

  constructor(
    private store: Store<CFAppState>,
    private route: ActivatedRoute,
    private scmService: GitSCMService,
    private httpClient: HttpClient,
    private appDeploySourceTypes: ApplicationDeploySourceTypes
  ) {
    this.sourceTypes = appDeploySourceTypes.getTypes();
  }

  onNext: StepOnNextFunction = () => {
    // Set the details based on which source type is selected
    if (this.sourceType.group === 'gitscm') {
      this.store.dispatch(new SaveAppDetails({
        projectName: this.repository,
        branch: this.repositoryBranch,
        url: this.scm.getCloneURL(this.repository),
        commit: this.isRedeploy ? this.commitInfo.sha : undefined
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
    this.sourceType$ = combineLatest(
      of(this.appDeploySourceTypes.getAutoSelectedType(this.route)),
      this.store.select(selectSourceType),
      of(this.sourceTypes[this.INITIAL_SOURCE_TYPE])
    ).pipe(
      map(([sourceFromStore, sourceFromParam, sourceDefault]) => sourceFromParam || sourceFromStore || sourceDefault),
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
      first(),
      tap(sourceType => {
        this.setSourceType(sourceType);
        this.sourceType = sourceType;
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
        switchMap(state =>
          cfEntityCatalog.gitBranch.store.getPaginationService(null, null, {
            scm: this.scm,
            projectName: state.name
          }).entities$
        ),
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


          if (this.isRedeploy) {
            const commitSha = commit || branch.commit.sha;
            // FIXME: This method to create entity id's should be standardised.... #4245
            const repoEntityID = `${this.scm.getType()}-${projectInfo.full_name}`;
            const commitEntityID = `${repoEntityID}-${commitSha}`;
            const commitEntityService = cfEntityCatalog.gitCommit.store.getEntityService(commitEntityID, null, {
              projectName: projectInfo.full_name,
              scm: this.scm, commitSha
            })

            if (this.commitSubscription) {
              this.commitSubscription.unsubscribe();
            }
            this.commitSubscription = commitEntityService.waitForEntity$.pipe(
              first(),
              map(p => p.entity),
              tap(p => this.commitInfo = p),
            ).subscribe();
          }
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
