import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, mergeMap } from 'rxjs/operators';

import {
  GithubCommitsListConfigServiceDeploy,
} from '../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-deploy.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { GithubCommit } from '../../../../../store/types/github.types';

@Component({
  selector: 'app-commit-list-wrapper',
  templateUrl: './commit-list-wrapper.component.html',
  styleUrls: ['./commit-list-wrapper.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        datePipe: DatePipe) => {
        return new GithubCommitsListConfigServiceDeploy(store, datePipe);
      },
      deps: [Store, DatePipe]
    }
  ],
})
export class CommitListWrapperComponent {

  selectedCommit$: Observable<APIResource<GithubCommit>>;

  constructor(
    private listConfig: ListConfig<APIResource<GithubCommit>>
  ) {
    const initialised$ = this.listConfig.getInitialised().pipe(
      filter(initialised => initialised)
    );
    this.selectedCommit$ = initialised$.pipe(
      mergeMap(() => this.listConfig.getDataSource().isSelecting$),
      map(() => this.listConfig.getDataSource().selectedRows),
      map(selectedRows => {
        const rows = Array.from(selectedRows.values());
        return rows.length > 0 ? rows[0] as APIResource<GithubCommit> : null;
      }),
    );
  }

}
