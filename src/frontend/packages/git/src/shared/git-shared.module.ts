import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule, MDAppModule, SharedModule } from '../../../core/src/public-api';
import { GithubCommitAuthorComponent } from './components/github-commit-author/github-commit-author.component';
import {
  TableCellCommitAuthorComponent,
} from './components/list/list-types/github-commits/table-cell-commit-author/table-cell-commit-author.component';
import { GitSCMService } from './scm/scm.service';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    MDAppModule,
  ],
  declarations: [
    TableCellCommitAuthorComponent,
    GithubCommitAuthorComponent
  ],
  exports: [
    GithubCommitAuthorComponent
  ],
  entryComponents: [
    TableCellCommitAuthorComponent
  ],
  providers: [
    GitSCMService
  ]
})
export class GitSharedModule { }