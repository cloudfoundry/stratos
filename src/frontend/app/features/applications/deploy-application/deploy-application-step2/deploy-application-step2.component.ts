import { Component, OnInit, OnDestroy, ViewChild, AfterContentInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { selectNewAppState } from '../../../../store/effects/create-app-effects';
import {
  SetAppSourceDetails,
  SetAppSourceSubType,
  FetchBranchesForProject,
  SaveAppDetails,
  FetchCommit,
  SetDeployBranch,
  SetBranch,
} from '../../../../store/actions/deploy-applications.actions';
import { filter, mergeMap, tap, skipWhile, switchMap, merge, map, take } from 'rxjs/operators';
import {
  SourceType,
  BranchesSchema,
  BranchSchema,
  GITHUB_BRANCHES_ENTITY_KEY,
  GITHUB_COMMIT_ENTITY_KEY
} from '../../../../store/types/deploy-application.types';
import {
  selectSourceType,
  selectSourceSubType,
  selectProjectExists,
  selectNewProjectCommit,
  selectDeployBranchName,
  selectNewProjectBranch,
  selectPEProjectName
} from '../../../../store/selectors/deploy-application.selector';
import { Subscription } from 'rxjs/Subscription';
import { NgForm } from '@angular/forms';
import { OnChanges } from '@angular/core/src/metadata/lifecycle_hooks';
import { selectPaginationState } from '../../../../store/selectors/pagination.selectors';
import { getPaginationPages } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { PaginatedAction } from '../../../../store/types/pagination.types';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { GitBranch, GithubCommit } from '../../../../store/types/github.types';
import { combineAll } from 'rxjs/operators/combineAll';
import { withLatestFrom } from 'rxjs/operators/withLatestFrom';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-deploy-application-step2',
  templateUrl: './deploy-application-step2.component.html',
  styleUrls: ['./deploy-application-step2.component.scss']
})

export class DeployApplicationStep2Component implements OnInit, OnDestroy, AfterContentInit {


  sourceTypes: SourceType[] = [{ name: 'Git', id: 'git' }];
  sourceType$: Observable<SourceType>;
  GIT_SOURCE_TYPE = 0;
  GITHUB_SUB_SOURCE_TYPE = 0;
  sourceSubTypes: SourceType[] = [{ id: 'github', name: 'Public Github' }, { id: 'giturl', name: 'Public Git URL' }];
  sourceSubType$: Observable<string>;
  repositoryBranches$: Observable<any>;
  validate: Observable<boolean>;
  projectInfo$: Observable<any>;
  commitInfo$: Observable<GithubCommit>;

  // ngModel Properties
  sourceType: SourceType;
  sourceSubType: SourceType;
  repositoryBranch: GitBranch = { name: null, commit: null };
  repository: string;


  @ViewChild('sourceSelectionForm')
  sourceSelectionForm: NgForm;
  subscriptions: Array<Subscription> = [];
  isReDeploy = false;

  ngOnDestroy(): void {
    this.subscriptions.forEach(p => p.unsubscribe());
  }

  constructor(
    private store: Store<AppState>,
    private route: ActivatedRoute
  ) { }

  onNext = () => {
    this.store.dispatch(new SaveAppDetails({
      projectName: this.repository,
      branch: this.repositoryBranch
    }));
    return Observable.of({ success: true });
  }

  ngOnInit() {

    this.isReDeploy = this.route.snapshot.queryParams['redeploy'];

    this.sourceType$ = this.store.select(selectSourceType);
    this.sourceSubType$ = this.store.select(selectSourceSubType);

    const fetchBranches = this.store.select(selectProjectExists).pipe(
      filter(state => state && !state.checking && state.exists),
      tap(p => {
          this.store.dispatch(new FetchBranchesForProject(p.name));
      })
    ).subscribe();

    this.subscriptions.push(fetchBranches);

    const action = {
      entityKey: GITHUB_BRANCHES_ENTITY_KEY,
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

    this.repositoryBranches$ = getPaginationPages(this.store, action, BranchesSchema)
    .pipe(
      filter(d => !!d[0] && !!Object.keys(d[0]).length),
      map(d => d[0]),
      withLatestFrom(deployBranchName$),
      tap(([branches, branchName]) => {
        this.repositoryBranch = branches.find(branch => branch.name === branchName);
      }),
      map(([p, q]) => p)
    );

    const updateBranchAndCommit = Observable.combineLatest(
      this.repositoryBranches$,
      deployBranchName$,
      this.projectInfo$)
    .pipe(
      tap(([branches, name, projectInfo]) => {
        const branch = (branches.find(b => b.name === name));
        if (branch) {
          this.store.dispatch(new SetBranch(branch));
          this.store.dispatch(new FetchCommit(branch.commit));
          this.fetchCommit(branch);
        }
      }
    ));

    this.subscriptions.push(updateBranchAndCommit.subscribe());

    const setInitialSourceType$ = this.store.select(selectSourceType).pipe(
      filter(p => !p),
      take(1),
      tap(p => {
          this.setSourceType( this.sourceTypes[this.GIT_SOURCE_TYPE]);
          this.setSourceSubType(this.sourceSubTypes[this.GITHUB_SUB_SOURCE_TYPE]);
        }
      )
    );

    const setSourceTypeModel$ = this.store.select(selectSourceType).pipe(
      filter(p => !!p),
      tap(p => {
          this.sourceType = this.sourceTypes.find(s => s.id === p.id);
          this.sourceSubType = this.sourceSubTypes.find(s => s.id === p.subType);
        }
      )
    );

    const setProjectName = this.store.select(selectPEProjectName)
      .pipe(
        filter(p => !!p),
        take(1),
        tap( p => {
          this.repository = p;
        })
      );

    this.subscriptions.push(setInitialSourceType$.subscribe());
    this.subscriptions.push(setSourceTypeModel$.subscribe());
    this.subscriptions.push(setProjectName.subscribe());

  }

  setSourceType = (event) => this.store.dispatch(new SetAppSourceDetails(event));

  fetchCommit = (branch) => {
    this.commitInfo$ = this.store.select<GithubCommit>(selectEntity(GITHUB_COMMIT_ENTITY_KEY, branch.commit.sha));
  }

  setSourceSubType = (event) => this.store.dispatch(new SetAppSourceSubType(event));

  updateBranchName(branch: GitBranch) {
    this.store.dispatch(new SetDeployBranch(branch.name));
  }

  ngAfterContentInit() {
    if (this.isReDeploy) {
      this.validate = Observable.of(true);
    } else {
      this.validate = this.sourceSelectionForm.statusChanges
      .map(() => {
        return this.sourceSelectionForm.valid;
      });
    }

  }

}
