import { AfterContentInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, take, tap } from 'rxjs/operators';
import { withLatestFrom } from 'rxjs/operators/withLatestFrom';
import { Subscription } from 'rxjs/Subscription';

import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import {
  FetchBranchesForProject,
  FetchCommit,
  SaveAppDetails,
  SetAppSourceDetails,
  SetAppSourceSubType,
  SetBranch,
  SetDeployBranch,
} from '../../../../store/actions/deploy-applications.actions';
import { AppState } from '../../../../store/app-state';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  selectDeployBranchName,
  selectPEProjectName,
  selectProjectExists,
  selectSourceSubType,
  selectSourceType,
} from '../../../../store/selectors/deploy-application.selector';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { SourceType } from '../../../../store/types/deploy-application.types';
import {
  GitBranch,
  GithubCommit,
  GithubRepo,
} from '../../../../store/types/github.types';
import { PaginatedAction } from '../../../../store/types/pagination.types';
import { entityFactory } from '../../../../store/helpers/entity-factory';
import { githubBranchesSchemaKey, githubCommitSchemaKey } from '../../../../store/helpers/entity-factory';

@Component({
  selector: 'app-deploy-application-step2',
  templateUrl: './deploy-application-step2.component.html',
  styleUrls: ['./deploy-application-step2.component.scss']
})
export class DeployApplicationStep2Component
  implements OnInit, OnDestroy, AfterContentInit {
  branchesSubscription: Subscription;
  commitInfo: GithubCommit;
  sourceTypes: SourceType[] = [{ name: 'Git', id: 'git' }];
  sourceType$: Observable<SourceType>;
  GIT_SOURCE_TYPE = 0;
  GITHUB_SUB_SOURCE_TYPE = 0;
  sourceSubTypes: SourceType[] = [
    { id: 'github', name: 'Public Github' },
    { id: 'giturl', name: 'Public Git URL' }
  ];
  sourceSubType$: Observable<string>;
  repositoryBranches$: Observable<any>;
  validate: Observable<boolean>;
  projectInfo$: Observable<GithubRepo>;
  commitSubscription: Subscription;

  // ngModel Properties
  sourceType: SourceType;
  sourceSubType: SourceType;
  repositoryBranch: GitBranch = { name: null, commit: null };
  repository: string;

  @ViewChild('sourceSelectionForm') sourceSelectionForm: NgForm;
  subscriptions: Array<Subscription> = [];
  isReDeploy = false;

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
    private paginationMonitorFactory: PaginationMonitorFactory
  ) { }

  onNext = () => {
    this.store.dispatch(
      new SaveAppDetails({
        projectName: this.repository,
        branch: this.repositoryBranch
      })
    );
    return Observable.of({ success: true });
  }

  ngOnInit() {
    this.isReDeploy = this.route.snapshot.queryParams['redeploy'];

    this.sourceType$ = this.store.select(selectSourceType);
    this.sourceSubType$ = this.store.select(selectSourceSubType);

    const fetchBranches = this.store
      .select(selectProjectExists)
      .pipe(
        filter(state => state && !state.checking && state.exists),
        tap(p => {
          if (this.branchesSubscription) {
            this.branchesSubscription.unsubscribe();
          }
          const action = new FetchBranchesForProject(p.name);
          this.branchesSubscription = getPaginationObservables<APIResource>(
            {
              store: this.store,
              action,
              paginationMonitor: this.paginationMonitorFactory.create(
                action.paginationKey,
                entityFactory(githubBranchesSchemaKey)
              )
            },
            true
          ).entities$.subscribe();
        })
      )
      .subscribe();

    this.subscriptions.push(fetchBranches);

    const action = {
      entityKey: githubBranchesSchemaKey,
      paginationKey: 'branches'
    } as PaginatedAction;
    this.projectInfo$ = this.store.select(selectProjectExists).pipe(
      filter(p => {
        return p && !!p.data;
      }),
      map(p => p.data),
      tap(p => {
        if (!this.isReDeploy) {
          this.store.dispatch(new SetDeployBranch(p.default_branch));
        }
      })
    );

    const deployBranchName$ = this.store.select(selectDeployBranchName);

    const paginationMonitor = this.paginationMonitorFactory.create<APIResource<GitBranch>>(
      action.paginationKey,
      entityFactory(githubBranchesSchemaKey)
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

    const updateBranchAndCommit = Observable.combineLatest(
      this.repositoryBranches$,
      deployBranchName$,
      this.projectInfo$
    ).pipe(
      tap(([branches, name, projectInfo]) => {
        const branch = branches.find(b => b.name === name);
        if (branch) {
          this.store.dispatch(new SetBranch(branch));

          const commitEntityService = this.entityServiceFactory.create<EntityInfo>(
            githubCommitSchemaKey,
            entityFactory(githubCommitSchemaKey),
            branch.commit.sha,
            new FetchCommit(branch.commit.sha, projectInfo.full_name),
            false
          );

          if (this.commitSubscription) {
            this.commitSubscription.unsubscribe();
          }
          this.commitSubscription = commitEntityService.waitForEntity$
            .pipe(
              map(p => p.entity.entity),
              tap(p => {
                this.commitInfo = p;
              })
            )
            .subscribe();
        }
      })
    );

    this.subscriptions.push(updateBranchAndCommit.subscribe());

    const setInitialSourceType$ = this.store.select(selectSourceType).pipe(
      filter(p => !p),
      take(1),
      tap(p => {
        this.setSourceType(this.sourceTypes[this.GIT_SOURCE_TYPE]);
        this.setSourceSubType(this.sourceSubTypes[this.GITHUB_SUB_SOURCE_TYPE]);
      })
    );

    const setSourceTypeModel$ = this.store.select(selectSourceType).pipe(
      filter(p => !!p),
      tap(p => {
        this.sourceType = this.sourceTypes.find(s => s.id === p.id);
        this.sourceSubType = this.sourceSubTypes.find(s => s.id === p.subType);
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
  }

  setSourceType = event => this.store.dispatch(new SetAppSourceDetails(event));

  setSourceSubType = event =>
    this.store.dispatch(new SetAppSourceSubType(event))

  updateBranchName(branch: GitBranch) {
    this.store.dispatch(new SetDeployBranch(branch.name));
  }

  ngAfterContentInit() {
    this.validate = this.sourceSelectionForm.statusChanges.map(() => {
      return this.sourceSelectionForm.valid || this.isReDeploy;
    });
  }
}
