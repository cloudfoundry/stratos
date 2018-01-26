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
  FetchCommit
} from '../../../../store/actions/deploy-applications.actions';
import { filter, mergeMap, tap, skipWhile, switchMap, merge, map, take } from 'rxjs/operators';
import { SourceType, Commit, GitBranch } from '../../../../store/types/deploy-application.types';
import {
   selectSourceType,
   selectSourceSubType,
   selectProjectExists,
   selectProjectBranches,
   selectNewProjectCommit
  } from '../../../../store/selectors/deploy-application.selector';
import { Subscription } from 'rxjs/Subscription';
import { NgForm } from '@angular/forms';
import { OnChanges } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'app-deploy-application-step2',
  templateUrl: './deploy-application-step2.component.html',
  styleUrls: ['./deploy-application-step2.component.scss']
})

export class DeployApplicationStep2Component implements OnInit, OnDestroy, AfterContentInit {
  sourceTypes: SourceType[] = [{name: 'Git', id: 'git'}];
  sourceType$: Observable<SourceType>;
  sourceType: SourceType;
  sourceSubType$: Observable<string>;
  gitSection: string;
  repositoryBranch: GitBranch = { name: null };
  defaultBranch: string;
  repositoryBranches$: Observable<any>;
  fetchBranches$: Subscription;
  repository: any;
  validate: Observable<boolean>;
  projectInfo$: Observable<any>;
  commitInfo$: Observable<Commit>;

  @ViewChild('sourceSelectionForm')
  sourceSelectionForm: NgForm;

  ngOnDestroy(): void {
    this.fetchBranches$.unsubscribe();
  }

  constructor(
    private store: Store<AppState>
  ) {}

  onNext = () => {
    this.store.dispatch(new SaveAppDetails({
      projectName: this.repository,
      branch: this.repositoryBranch
    }));
    return Observable.of({ success: true });
  }

  ngOnInit() {
    this.sourceType$ = this.store.select(selectSourceType);
    this.sourceSubType$ = this.store.select(selectSourceSubType);
    this.fetchBranches$ = this.store.select(selectProjectExists).pipe(
      filter(state => state && !state.checking && state.exists),
       tap( p => {
        this.store.dispatch(new FetchBranchesForProject(p.name));
       })
    ).subscribe();
    this.repositoryBranches$ = this.store.select(selectProjectBranches).pipe(
      filter(state => state && !state.fetching && state.success),
      map(state => state.data),
      tap(p => {
        this.repositoryBranch = p.find(branch => branch.name === this.defaultBranch);
        this.fetchCommit(this.repositoryBranch);
      })
    );
    this.projectInfo$ = this.store.select(selectProjectExists).pipe(
      filter(p => p && !!p.data),
      map(p => p.data),
      tap(p => {
        this.defaultBranch = p.default_branch;
      })
    );
    this.commitInfo$ = this.store.select(selectNewProjectCommit).pipe(
      filter(p => !!p)
    );

    // Auto select `git` type
    this.sourceType = this.sourceTypes[0];
    this.setSourceType(this.sourceType);
  }

  setSourceType = (event)  => this.store.dispatch(new SetAppSourceDetails({type: event}));

  fetchCommit = (branch) => this.store.dispatch(new FetchCommit(branch.commit));

  setSourceSubType = (event) => this.store.dispatch(new SetAppSourceSubType(event));


  ngAfterContentInit() {
    this.validate = this.sourceSelectionForm.statusChanges
      .map(() => {
        return this.sourceSelectionForm.valid;
      });
  }

}
