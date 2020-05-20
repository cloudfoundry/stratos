import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { GitCommit } from '../../../../../../../cloud-foundry/src/store/types/git.types';
import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  GithubCommitsListConfigServiceDeploy,
} from '../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-deploy.service';
import { GitSCMService } from '../../../../../shared/data-services/scm/scm.service';

@Component({
  selector: 'app-commit-list-wrapper',
  templateUrl: './commit-list-wrapper.component.html',
  styleUrls: ['./commit-list-wrapper.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useFactory: (
        store: Store<CFAppState>,
        datePipe: DatePipe,
        scmService: GitSCMService) => {
        return new GithubCommitsListConfigServiceDeploy(store, datePipe, scmService);
      },
      deps: [Store, DatePipe, GitSCMService]
    }
  ],
})
export class CommitListWrapperComponent {

  selectedCommit$: Observable<GitCommit>;

  constructor(
    private listConfig: ListConfig<GitCommit>
  ) {
    const initialised$ = this.listConfig.getInitialised().pipe(
      filter(initialised => initialised)
    );
    this.selectedCommit$ = initialised$.pipe(
      mergeMap(() => this.listConfig.getDataSource().isSelecting$),
      map(() => this.listConfig.getDataSource().selectedRows),
      map(selectedRows => {
        const rows = Array.from(selectedRows.values());
        return rows.length > 0 ? rows[0] as GitCommit : null;
      }),
    );
  }

}
