import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import {
  GithubCommitsListConfigServiceDeploy,
} from '../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-deploy.service';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
<<<<<<< HEAD:src/frontend/packages/core/src/features/applications/deploy-application/deploy-application-step2-1/commit-list-wrapper/commit-list-wrapper.component.ts
import { AppState } from '../../../../../../../store/src/app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { GithubCommit } from '../../../../../../../store/src/types/github.types';
=======
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { GitCommit } from '../../../../../store/types/git.types';
import { GitSCMService } from '../../../../../shared/data-services/scm/scm.service';
>>>>>>> v2-master:src/frontend/app/features/applications/deploy-application/deploy-application-step2-1/commit-list-wrapper/commit-list-wrapper.component.ts

@Component({
  selector: 'app-commit-list-wrapper',
  templateUrl: './commit-list-wrapper.component.html',
  styleUrls: ['./commit-list-wrapper.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<AppState>,
        datePipe: DatePipe,
        scmService: GitSCMService) => {
        return new GithubCommitsListConfigServiceDeploy(store, datePipe, scmService);
      },
      deps: [Store, DatePipe, GitSCMService]
    }
  ],
})
export class CommitListWrapperComponent {

  selectedCommit$: Observable<APIResource<GitCommit>>;

  constructor(
    private listConfig: ListConfig<APIResource<GitCommit>>
  ) {
    const initialised$ = this.listConfig.getInitialised().pipe(
      filter(initialised => initialised)
    );
    this.selectedCommit$ = initialised$.pipe(
      mergeMap(() => this.listConfig.getDataSource().isSelecting$),
      map(() => this.listConfig.getDataSource().selectedRows),
      map(selectedRows => {
        const rows = Array.from(selectedRows.values());
        return rows.length > 0 ? rows[0] as APIResource<GitCommit> : null;
      }),
    );
  }

}
