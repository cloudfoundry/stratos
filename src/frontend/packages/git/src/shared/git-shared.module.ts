import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CreateEndpointModule } from '../../../core/src/features/endpoints/create-endpoint/create-endpoint.module';
import { CoreModule, MDAppModule, SharedModule } from '../../../core/src/public-api';
import { GitRegistrationComponent } from './components/git-registration/git-registration.component';
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
    CreateEndpointModule // TODO: RC this means it won't be lazy loaded
  ],
  declarations: [
    TableCellCommitAuthorComponent,
    GithubCommitAuthorComponent,
    GitRegistrationComponent,
  ],
  exports: [
    GithubCommitAuthorComponent,
    GitRegistrationComponent
  ],
  entryComponents: [
    TableCellCommitAuthorComponent,
    GitRegistrationComponent
  ],
  providers: [
    GitSCMService
  ]
})
export class GitSharedModule { }