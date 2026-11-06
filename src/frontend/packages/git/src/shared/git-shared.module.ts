import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule, CreateEndpointModule, MDAppModule, SharedModule } from '@stratosui/core';
import { GitEndpointDetailsComponent } from './components/git-endpoint-details/git-endpoint-details.component';
import { GitRegistrationComponent } from './components/git-registration/git-registration.component';
import { GithubCommitAuthorComponent } from './components/github-commit-author/github-commit-author.component';
import { GitSCMService } from './scm/scm.service';

@NgModule({
    imports: [
        CoreModule,
        CommonModule,
        SharedModule,
        MDAppModule,
        // Need to import this so that the git register endpoints process can use the generic register and connect steps
        // HOWEVER as this module is not lazy loaded it will be brought in on app load
        CreateEndpointModule,
        // Standalone components
        GithubCommitAuthorComponent,
        GitRegistrationComponent,
        GitEndpointDetailsComponent,
    ],
    exports: [
        GithubCommitAuthorComponent,
        GitRegistrationComponent,
        GitEndpointDetailsComponent,
    ],
    providers: [
        GitSCMService
    ]
})
export class GitSharedModule { }
