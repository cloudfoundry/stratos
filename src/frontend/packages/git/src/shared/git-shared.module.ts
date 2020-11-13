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
    // Need to import this so that the git register endpoints process can use the generic register and connect steps
    // HOWEVER as this module is not lazy loaded it will be brought in on app load
    CreateEndpointModule
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