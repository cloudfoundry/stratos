import { Injectable, Inject } from '@angular/core';
import { GitLabSCM } from './gitlab-scm';
import { GitHubSCM } from './github-scm';
import { GITHUB_API_URL } from '../../../core/github.helpers';
import { Http } from '@angular/http';
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
    private http: Http,
    @Inject(GITHUB_API_URL) private gitHubURL: string
  ) {
    const scmArray = [
      new GitHubSCM(this.http, gitHubURL),
      new GitLabSCM(this.http)
    ];

    this.scms = scmArray.reduce((obj, item) => {
      obj[item.getType()] = item;
      return obj;
    }, {} as GitSCMs);
  }

  public getSCM(type: GitSCMType) {
    return this.scms[type];
  }

}
