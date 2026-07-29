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
  GitDataService,
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
import { DeployApplicationState, ProjectExists, SourceType } from '../../../../store/types/deploy-application.types';
import { ApplicationDeploySourceTypes, DEPLOY_TYPES_IDS } from '../deploy-application-steps.types';
import { GitSuggestedRepo } from './../../../../../../git/src/store/git.public-types';
import { GithubProjectExistsDirective } from '../github-project-exists.directive';
import { DeployApplicationFsComponent } from './deploy-application-fs/deploy-application-fs.component';
import { FileScannerInfo } from './deploy-application-fs/deploy-application-fs-scanner';



// Access mode for the gitscm (GitHub / GitLab) source sub-form.
//  public     — public host repo, no auth
//  private    — host private repo, access token only (no base URL)
//  enterprise — custom base URL (GitHub Enterprise / self-hosted GitLab) + token
export type GitAccessMode = 'public' | 'private' | 'enterprise';

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
  private gitData = inject(GitDataService);
  private deployState$ = toObservable(this.deployData.state);
  private sourceType$$ = toObservable(this.deployData.sourceType);
  private projectExists$ = toObservable(this.deployData.projectExists);
  private deployBranchName$ = toObservable(this.deployData.deployBranchName);
  private deployCommit$ = toObservable(this.deployData.newProjectCommit);
  private peProjectName$ = toObservable(this.deployData.projectName);


  @Input() isRedeploy = false;

  commitInfo?: GitCommit;
  public DEPLOY_TYPES_IDS = DEPLOY_TYPES_IDS;
  sourceType$!: Observable<SourceType>;
  INITIAL_SOURCE_TYPE = 0; // Fall back to GitHub, for cases where there's no type in store (refresh) or url (removed & nav)
  validate!: Observable<boolean>;

  stepperText$!: Observable<string | null | undefined>;

  // Observables for source types
  sourceTypeGithub$!: Observable<boolean>;
  sourceTypeNeedsUpload$!: Observable<boolean>;
  // tslint:disable-next-line:ban-types
  canDeployType$!: Observable<boolean>;
  isLoading$!: Observable<boolean>;

  // Local FS data when file or folder upload; bound via ngModel so the
  // fsLocalSource control participates in form validation.
  fsSourceData: FileScannerInfo | undefined;

  // ---- GIT ----------
  repositoryBranches$!: Observable<GitBranch[]>;

  projectInfo$!: Observable<GitRepo>;
  commitSubscription!: Subscription;

  // Set from the source-type stream in ngOnInit before any user action
  // (Next button / template reads) can fire.
  sourceType!: SourceType;
  repositoryBranch?: GitBranch;
  repository = '';

  // Assigned in setupForGit's source-type subscription before repo/branch
  // lookups run; reads are all downstream of that assignment.
  scm!: GitSCM;

  cachedSuggestions = {};

  // We don't have any repositories to suggest initially - need user to start typing
  suggestedRepos$!: Observable<GitSuggestedRepo[]>;

  // GitHub Enterprise / private repo support
  isInvalidGithubEnterpriseUrl = false;
  githubEnterpriseUrl = '';
  accessToken = '';

  // Active git access mode for the gitscm sub-form, driven by the
  // Public / Private / Enterprise tab strip. Held as local component state —
  // the store still sees only githubEnterpriseUrl + accessToken. Switching
  // tabs clears the fields that don't belong to the new mode so a stale base
  // URL / token is never carried into the deploy.
  gitMode: GitAccessMode = 'public';
  // --------------

  // Endpoint guid to use for the project-exists validator (and repo/branch
  // lookups). When the user is in Private/Enterprise mode they've supplied a
  // token directly in the form, so we must talk to the SCM API with that token
  // rather than proxying through a registered endpoint (whose stored creds —
  // or lack thereof — would otherwise be used, causing a 404 on a private repo
  // the typed token can actually see). Only use the registered endpoint's guid
  // in Public mode.
  get projectExistsEndpointGuid(): string {
    return this.gitMode === 'public' ? (this.sourceType?.endpointGuid ?? '') : '';
  }

  // Base API URL to pass to the project-exists validator so its own SCM
  // instance targets the same host the suggestions/lookup SCM does. Empty in
  // Public mode (the validator uses the registered endpoint / default public
  // API). In Private/Enterprise mode it's the user-supplied base URL,
  // normalized to /api/v4 for GitLab so the validator hits the REST API rather
  // than the web UI (which 302-redirects and yields a false "not found").
  get scmBaseApiUrl(): string {
    if (this.gitMode === 'public' || !this.githubEnterpriseUrl) {
      return '';
    }
    return this.sourceType?.id === DEPLOY_TYPES_IDS.GITLAB
      ? DeployApplicationStep2Component.normalizeGitlabApiUrl(this.githubEnterpriseUrl)
      : this.githubEnterpriseUrl;
  }

  // Git URL
  gitUrl!: string;
  gitUrlBranchName!: string;
  // --------------

  // ---- Docker ----------
  dockerAppName = '';
  dockerImg = '';
  dockerUsername = '';
  // --------------

  // strict: static @ViewChild, resolved by Angular before ngOnInit/ngAfterContentInit run.
  @ViewChild('sourceSelectionForm', { static: true }) sourceSelectionForm!: NgForm;
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
      const branch = this.repositoryBranch;
      // Public mode deploys via the registered endpoint (its stored creds);
      // Private/Enterprise mode deploys with the token typed in the form and
      // no endpoint. So only require an endpoint guid in Public mode.
      const endpointGuid: string = this.gitMode === 'public' ? (this.sourceType.endpointGuid ?? '') : '';
      this.gitData.getRepository(this.scm, this.repository)
        .waitForValue$.pipe(take(1), defaultIfEmpty(null)).subscribe(repo => {
        // A gitscm save needs a resolved repo and branch. An endpoint guid is
        // only required for Public mode; Private/Enterprise carry the token.
        if (!repo || !branch) { return; }
        if (this.gitMode === 'public' && !endpointGuid) { return; }
        this.deployData.saveAppDetails({
          projectName: this.repository,
          branch,
          url: repo.clone_url,
          accessToken: this.accessToken,
          commit: this.isRedeploy ? this.commitInfo?.sha : undefined,
          endpointGuid,
        }, null);
      });
    } else if (this.sourceType.id === DEPLOY_TYPES_IDS.GIT_URL) {
      this.deployData.saveAppDetails({
        projectName: this.gitUrl,
        branch: {
          name: this.gitUrlBranchName,
          guid: '',
          projectName: '',
          scmType: '',
          endpointGuid: '',
        },
        endpointGuid: ''
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
      filter((appDetail): appDetail is DeployApplicationState & { cloudFoundryDetails: NonNullable<DeployApplicationState['cloudFoundryDetails']>; } =>
        !!appDetail && !!appDetail.cloudFoundryDetails),
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
    // strict: NgForm.statusChanges is non-null once the form exists, which is
    // guaranteed by the time ngAfterContentInit runs for the static form.
    this.validate = this.sourceSelectionForm.statusChanges!.pipe(map(() => {
      return this.sourceSelectionForm.valid || this.isRedeploy;
    }));
  }

  /* Git ------------------*/
  private setupForGit() {
    // Land the tab strip on the mode that matches any restored auth values.
    this.gitMode = DeployApplicationStep2Component.deriveGitMode(this.githubEnterpriseUrl, this.accessToken);
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
        filter((state): state is ProjectExists => !!state && !state.checking && !state.error && state.exists),
        distinctUntilChanged((x, y) => x.name.toLowerCase() === y.name.toLowerCase()),
        // Convert project name into branches observable
        switchMap(state => this.gitData.getBranches(this.scm, state.name)),
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
            const commitSha = commit || branch.commit?.sha;

            if (this.commitSubscription) {
              this.commitSubscription.unsubscribe();
            }
            if (!commitSha) { return; }
            this.commitSubscription = this.gitData.getCommit(this.scm, projectInfo.full_name, commitSha)
              .waitForValue$.pipe(
                take(1),
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
        const matched = sourceTypes.find(s => s.id === p.id && (p.endpointGuid ? s.endpointGuid === p.endpointGuid : true));
        if (!matched) { return; }
        this.sourceType = matched;

        const newScm = this.scmService.getSCM(
          matched.id as GitSCMType,
          // In Private/Enterprise mode the user supplies a token directly, so
          // don't bind the SCM to a registered endpoint (which would proxy via
          // the endpoint's own creds and 404 on private repos the typed token
          // can see). Public mode still uses the registered endpoint guid.
          this.gitMode === 'public' ? (matched.endpointGuid ?? '') : '',
        );
        if (newScm) {
          // User selected one of the SCM options
          if (this.scm && newScm.getType() !== this.scm.getType()) {
            // User changed the SCM type, so reset the project and branch
            this.repository = '';
            this.commitInfo = undefined;
            this.repositoryBranch = undefined;
            this.deployData.setBranch(null);
            this.deployData.projectDoesntExist('');
            // Reset clears the project so canDeploy is false again; the branch
            // has no meaning here (empty placeholder mirrors the cleared project).
            const clearedBranch: GitBranch = { name: '', guid: '', projectName: '', scmType: '', endpointGuid: '' };
            this.deployData.saveAppDetails({ projectName: '', branch: clearedBranch, endpointGuid: matched.endpointGuid ?? '' }, null);
          }
          this.scm = newScm;
        }
      })
    );

    const setProjectName = this.peProjectName$.pipe(
      filter((p): p is string => !!p),
      take(1),
      tap(p => {
        this.repository = p;
      })
    );

    this.subscriptions.push(setSourceTypeModel$.subscribe());
    this.subscriptions.push(setProjectName.subscribe());

    // strict: NgForm.valueChanges is non-null once the form is initialised,
    // which holds by the time setupForGit runs after ngOnInit.
    this.suggestedRepos$ = this.sourceSelectionForm.valueChanges!.pipe(
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
  // active SCM instance so that subsequent repo/branch/commit API calls
  // target the right host with the right Authorization header. Applies to
  // both GitHub (Enterprise) and self-hosted GitLab.
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
      // GitLab's REST API lives under /api/v4. Users type the plain host
      // (e.g. https://workshop.cloud.gov) in the Self-hosted GitLab field, so
      // normalize to the API root before it reaches the SCM — otherwise every
      // call hits the GitLab web UI (which 302-redirects to /users/sign_in for
      // an unauthenticated browser request, producing the CORS/redirect errors
      // and a spurious "Repository not found"). GitHub Enterprise users type
      // the full /api/v3 URL themselves, so only GitLab needs this.
      const apiUrl = this.scm.getType() === 'gitlab'
        ? DeployApplicationStep2Component.normalizeGitlabApiUrl(enterpriseUrl)
        : enterpriseUrl;
      (this.scm as unknown as BaseSCM).setPublicApi(apiUrl);
    }

    // Apply/clear the PAT for both GitHub and GitLab (both expose
    // setAccessToken/clearAccessToken). Previously this was gated to GitHub
    // only, so a GitLab token typed in Private/Enterprise mode was never sent
    // and private / self-hosted GitLab projects 404'd.
    const scmType = this.scm.getType();
    if (scmType === 'github' || scmType === 'gitlab') {
      const tokenScm = this.scm as unknown as { setAccessToken(t: string): void; clearAccessToken(): void };
      if (token) {
        tokenScm.setAccessToken(token);
      } else {
        tokenScm.clearAccessToken();
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
      // A failed suggestion lookup yields no suggestions for the typeahead.
      catchError(_e => observableOf([] as GitSuggestedRepo[])),
      tap(suggestions => (this.cachedSuggestions as { [key: string]: any })[cacheName] = suggestions),
    );
  }

  updateBranchName(branch: GitBranch) {
    this.deployData.setDeployBranch(branch.name);
  }

  // Infer the opening access mode from restored values (redeploy / nav back),
  // so the tab strip lands on the mode that matches what's already set. A base
  // URL implies Enterprise even before its token is entered; a token alone
  // (no URL) implies a Private host repo; neither implies Public.
  static deriveGitMode(enterpriseUrl: string | undefined, accessToken: string | undefined): GitAccessMode {
    if (enterpriseUrl) {
      return 'enterprise';
    }
    if (accessToken) {
      return 'private';
    }
    return 'public';
  }

  // Normalize a self-hosted GitLab base URL to its REST API root. The user
  // types the plain host (e.g. https://workshop.cloud.gov); the GitLab API is
  // served from `<host>/api/v4`. Idempotent: a URL that already ends in
  // /api/v4 (with or without a trailing slash) is returned unchanged, and any
  // trailing slash on the host is trimmed first so we never emit a double
  // slash. Falls back to the raw input if it isn't a parseable URL (the caller
  // has already flagged invalid URLs via isInvalidGithubEnterpriseUrl).
  static normalizeGitlabApiUrl(baseUrl: string): string {
    const trimmed = baseUrl.replace(/\/+$/, '');
    if (/\/api\/v4$/.test(trimmed)) {
      return trimmed;
    }
    return `${trimmed}/api/v4`;
  }

  // Tab handler: switch the active access mode and clear the now-irrelevant
  // auth fields (Public → drop URL + token; Private → drop URL, keep token;
  // Enterprise → keep both), then re-sync the SCM so a cleared token/URL stops
  // being applied to subsequent repo/branch lookups.
  setGitMode(mode: GitAccessMode): void {
    this.gitMode = mode;
    if (mode === 'public') {
      this.githubEnterpriseUrl = '';
      this.accessToken = '';
    } else if (mode === 'private') {
      this.githubEnterpriseUrl = '';
    }
    // Rebuild the SCM for the new mode: Public binds to the registered
    // endpoint guid (proxy via stored creds); Private/Enterprise talk to the
    // SCM API directly with the token typed in the form. Without this rebuild,
    // a Public-mode SCM (bound to the endpoint) would keep proxying and 404 on
    // private repos the typed token can actually see.
    if (this.sourceType) {
      const rebuilt = this.scmService.getSCM(
        this.sourceType.id as GitSCMType,
        mode === 'public' ? (this.sourceType.endpointGuid ?? '') : '',
      );
      if (rebuilt) {
        this.scm = rebuilt;
      }
    }
    this.applyGithubEnterpriseAndToken(this.githubEnterpriseUrl, this.accessToken);
  }

}
