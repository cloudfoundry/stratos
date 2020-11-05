import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { combineLatest, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Md5 } from 'ts-md5/dist/md5';

import { GitCommit, GitRepo } from '../../../store/types/git.types';
import { GitSCM, SCMIcon } from './scm';
import { GitSCMType } from './scm.service';

const gitLabAPIUrl = 'https://gitlab.com/api/v4';
const GITLAB_PER_PAGE_PARAM = 'per_page';
const GITLAB_PER_PAGE_PARAM_VALUE = 100;

export class GitLabSCM implements GitSCM {

  getType(): GitSCMType {
    return 'gitlab';
  }

  getLabel(): string {
    return 'GitLab';
  }

  getIcon(): SCMIcon {
    return {
      iconName: 'gitlab',
      fontName: 'stratos-icons'
    };
  }


  // TODO: RC this should be removed once deploy-app effects switches over to new approach
  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    const parts = projectName.split('/');

    const obs$ = parts.length !== 2 ?
      of(null) :
      httpClient.get(`${gitLabAPIUrl}/projects/${parts.join('%2F')}`);

    return obs$.pipe(
      map((data: any) => {
        if (!data) {
          throw new HttpErrorResponse({
            status: 404
          });
        }
        return this.convertProject(data);
      })
    );
  }

  getRepositoryApiUrl(projectName: string): string {
    const parts = projectName.split('/');
    if (parts.length !== 2) {
      // TODO: RC test
      throw new HttpErrorResponse({
        status: 404,
        statusText: 'Cannot get repository, not enough parts in project name'
      });
    }
    return `${gitLabAPIUrl}/projects/${parts.join('%2F')}`;
  }

  // getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
  //   const prjNameEncoded = encodeURIComponent(projectName);
  //   return httpClient.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches/${branchName}`).pipe(
  //     map((data: any) => {
  //       const nb = { ...data };
  //       nb.commit.sha = nb.commit.id;
  //       return nb;
  //     })
  //   );
  // }

  getBranchApiUrl(projectName: string, branchName: string): string {
    const prjNameEncoded = encodeURIComponent(projectName);
    return `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches/${branchName}`;
  }

  // getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
  //   const prjNameEncoded = encodeURIComponent(projectName);
  //   return httpClient.get(
  //     `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches`, {
  //     params: {
  //       [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
  //     }
  //   }
  //   ).pipe(
  //     map((data: any) => {
  //       const branches = [];
  //       data.forEach(b => {
  //         const nb = { ...b };
  //         nb.commit.sha = b.commit.id;
  //         branches.push(nb);
  //       });
  //       return branches;
  //     })
  //   );
  // }

  getBranchesApiUrl(projectName: string): string {
    const prjNameEncoded = encodeURIComponent(projectName);
    return `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches`;
  }

  // getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit> {
  //   return httpClient.get(this.getCommitApiUrl(projectName, commitSha)).pipe(
  //     map(data => {
  //       return this.convertCommit(projectName, data);
  //     })
  //   );
  // }

  getCommitApiUrl(projectName: string, commitSha: string,): string {
    const prjNameEncoded = encodeURIComponent(projectName);
    return `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits/${commitSha}`;
  }

  // getCommits(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit[]> {
  //   const prjNameEncoded = encodeURIComponent(projectName);
  //   return httpClient.get(
  //     `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits?ref_name=${commitSha}`, {
  //     params: {
  //       [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
  //     }
  //   }
  //   ).pipe(
  //     map((data: any) => {
  //       const commits = [];
  //       data.forEach(c => commits.push(this.convertCommit(projectName, c)));
  //       return commits;
  //     })
  //   );
  // }

  getCommitsApiUrl(projectName: string, ref: string): string {
    const prjNameEncoded = encodeURIComponent(projectName);
    return `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits?ref_name=${ref}&${GITLAB_PER_PAGE_PARAM}=${GITLAB_PER_PAGE_PARAM_VALUE.toString()}`;
  }

  getCloneURL(projectName: string): string {
    return `https://gitlab.com/${projectName}.git`;
  }

  getCommitURL(projectName: string, commitSha: string): string {
    return `https://gitlab.com/${projectName}/commit/${commitSha}`;
  }

  getCompareCommitURL(projectName: string, commitSha1: string, commitSha2: string): string {
    return `https://gitlab.com/${projectName}/compare/${commitSha1}...${commitSha2}`;
  }

  getMatchingRepositories(httpClient: HttpClient, projectName: string): Observable<string[]> {
    const prjParts = projectName.split('/');

    const obs$ = prjParts.length > 1 ?
      this.getMatchingUserGroupRepositories(httpClient, prjParts) :
      httpClient.get(`${gitLabAPIUrl}/projects?search=${projectName}`, {
        params: {
          [GITLAB_PER_PAGE_PARAM]: GITLAB_PER_PAGE_PARAM_VALUE.toString()
        }
      });

    return obs$.pipe(
      map((repos: any[]) => repos.map(item => item.path_with_namespace)),
    );
  }

  private getMatchingUserGroupRepositories(httpClient: HttpClient, prjParts: string[]): Observable<any[]> {
    return combineLatest([
      httpClient.get<[]>(`${gitLabAPIUrl}/users/${prjParts[0]}/projects/?search=${prjParts[1]}`).pipe(catchError(() => of([]))),
      httpClient.get<[]>(`${gitLabAPIUrl}/groups/${prjParts[0]}/projects?search=${prjParts[1]}`).pipe(catchError(() => of([]))),
    ]).pipe(
      map(([a, b]: [any[], any[]]) => a.concat(b)),
    );
  }

  private convertProject(prj: any): GitRepo {
    return {
      ...prj,
      full_name: prj.path_with_namespace,
      description: prj.description || prj.name_with_namespace,
      html_url: prj.web_url,
      owner: {
        name: prj.namespace.name,
        avatar_url: prj.avatar_url || '/core/assets/gitlab-logo.svg'
      }
    };
  }

  public convertCommit(projectName: string, commit: any): GitCommit {
    const emailMD5 = Md5.hashStr(commit.author_email);
    const avatarURL = `https://secure.gravatar.com/avatar/${emailMD5}?s=120&d=identicon`;

    return {
      html_url: this.getCommitURL(projectName, commit.id),
      author: {
        id: null,
        login: null,
        avatar_url: avatarURL,
        html_url: null
      },
      commit: {
        author: {
          date: commit.created_at,
          name: commit.author_name,
          email: commit.author_email
        },
        message: commit.message,
      },
      sha: commit.id
    };
  }

}
