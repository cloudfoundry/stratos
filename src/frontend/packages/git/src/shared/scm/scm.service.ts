import { Injectable, inject } from '@angular/core';

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


  public getSCM(type: GitSCMType, endpointGuid: string, accessToken?: string): GitSCM {
    switch (type) {
      case 'github':
        return new GitHubSCM(this.gitHubURL, endpointGuid, accessToken);
      case 'gitlab':
        return new GitLabSCM(endpointGuid);
    }
  }
}
