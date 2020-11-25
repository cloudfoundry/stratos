import { Inject, Injectable } from '@angular/core';

import { GITHUB_API_URL } from '../github.helpers';
import { GitHubSCM } from './github-scm';
import { GitLabSCM } from './gitlab-scm';
import { GitSCM } from './scm';

// Supported Git SCM providers
export type GitSCMType = 'github' | 'gitlab';

type GitSCMs = {
  [id in GitSCMType]: GitSCM
};

// Abstracts differences in Git-based SCM services such as GitHub and GitLab
@Injectable()
export class GitSCMService {

  private scms: GitSCMs;

  constructor(
    @Inject(GITHUB_API_URL) private gitHubURL: string
  ) {
    const scmArray = [
      new GitHubSCM(gitHubURL),
      new GitLabSCM()
    ];

    this.scms = scmArray.reduce((obj, item) => {
      obj[item.getType()] = item;
      return obj;
    }, {} as GitSCMs);
  }

  public getSCM(type: GitSCMType) {
    return this.scms[type];
  }

  public parseErrorAsString(res: any, type: GitSCMType): string {
    const response = this.parseHttpPipeError(res);
    const message = response.message || '';
    return this.getSCM(type).parseErrorString(res, message);
  }

  private parseHttpPipeError(res: any): { message?: string; } {
    if (!res.status) {
      return res;
    }
    try {
      return res.json ? res.json() : res;
    } catch (e) {
      console.warn('Failed to parse response body', e);
    }
    return {};
  }

}
