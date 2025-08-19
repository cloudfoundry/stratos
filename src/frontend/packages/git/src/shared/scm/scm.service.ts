import { Inject, Injectable } from '@angular/core';

import { GITHUB_API_URL } from '../github.helpers';
import { GitHubSCM } from './github-scm';
import { GitLabSCM } from './gitlab-scm';
import { GitSCM } from './scm';

// Supported Git SCM providers
export type GitSCMType = 'github' | 'gitlab';

// Abstracts differences in Git-based SCM services such as GitHub and GitLab
@Injectable()
export class GitSCMService {

  constructor(
    @Inject(GITHUB_API_URL) private gitHubURL: string
  ) {
  }

  public getSCM(type: GitSCMType, endpointGuid: string, access_token?: string): GitSCM {
    switch (type) {
      case 'github':
        return (access_token && access_token != "") ? new GitHubSCM(this.gitHubURL, endpointGuid, access_token) : new GitHubSCM(this.gitHubURL, endpointGuid);
      case 'gitlab':
        return new GitLabSCM(endpointGuid);
    }
  }
}
