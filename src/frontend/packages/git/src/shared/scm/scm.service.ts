import { Injectable, Injector, inject } from '@angular/core';
import { EndpointsDataService } from '@stratosui/store';

import { GITHUB_API_URL } from '../github.helpers';
import { GitHubSCM } from './github-scm';
import { GitLabSCM } from './gitlab-scm';
import { GitSCM } from './scm';

// Supported Git SCM providers
export type GitSCMType = 'github' | 'gitlab';

// Abstracts differences in Git-based SCM services such as GitHub and GitLab
@Injectable({
  providedIn: 'root'
})
export class GitSCMService {
  private gitHubURL = inject(GITHUB_API_URL);
  // W36-B Wave 3: thread EndpointsDataService + Injector through to
  // each SCM instance so its BaseSCM.getEndpoint() bridge can read
  // from the signal-native projection. Injector required because
  // BaseSCM.getEndpoint() calls toObservable() on a signal returned
  // by EndpointsDataService.
  private endpointsData = inject(EndpointsDataService);
  private injector = inject(Injector);


  public getSCM(type: GitSCMType, endpointGuid: string, accessToken?: string): GitSCM {
    switch (type) {
      case 'github':
        return new GitHubSCM(this.gitHubURL, endpointGuid, accessToken, this.endpointsData, this.injector);
      case 'gitlab':
        return new GitLabSCM(endpointGuid, this.endpointsData, this.injector);
    }
  }
}
