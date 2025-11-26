import { DatePipe } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { type GitCommit, GitSCMService } from '@stratosui/git';
import type { Observable } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ListComponent } from '../../../../../../../core/src/shared/components/list/list.component';
import { ListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import {
  GithubCommitsListConfigServiceDeploy,
} from '../../../../../shared/components/list/list-types/github-commits/github-commits-list-config-deploy.service';

@Component({
  selector: 'app-commit-list-wrapper',
  templateUrl: './commit-list-wrapper.component.html',
  styleUrls: ['./commit-list-wrapper.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ],
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
    },
    DatePipe
  ],
})
export class CommitListWrapperComponent {

  private readonly listConfig = inject<ListConfig<GitCommit>>(ListConfig);

  selectedCommit$: Observable<GitCommit>;

  constructor() {
    const initialised$ = this.listConfig.getInitialised().pipe(
      filter(initialised => initialised)
    );
    this.selectedCommit$ = initialised$.pipe(
      mergeMap(() => this.listConfig.getDataSource().isSelecting$),
      map(() => this.listConfig.getDataSource().selectedRows()),
      map(selectedRows => {
        const rows = Array.from(selectedRows.values());
        return rows.length > 0 ? rows[0] as GitCommit : null;
      }),
    );
  }

}
