import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';
import { Md5 } from 'ts-md5/dist/md5';

import { GitBranch, GitCommit, GitRepo } from '../../../store/types/git.types';
import { GitSCM, SCMIcon } from './scm';
import { GitSCMType } from './scm.service';

const gitLabAPIUrl = 'https://gitlab.com/api/v4';

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

  getRepository(httpClient: HttpClient, projectName: string): Observable<GitRepo> {
    const parts = projectName.split('/');

    let obs$ = httpClient.get(`${gitLabAPIUrl}/users/${parts[0]}/projects?search=${parts[1]}`);
    if (parts.length !== 2) {
      obs$ = observableOf(null);
    }

    return obs$.pipe(
      map((data: any) => {
        if (data.length !== 1) {
          throw new HttpErrorResponse({
            status: 404
          });
        }
        return this.convertProject(data[0]);
      })
    );
  }

  getBranch(httpClient: HttpClient, projectName: string, branchName: string): Observable<GitBranch> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return httpClient.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches/${branchName}`).pipe(
      map((data: any) => {
        const nb = { ...data };
        nb.commit.sha = nb.commit.id;
        return nb;
      })
    );
  }

  getBranches(httpClient: HttpClient, projectName: string): Observable<GitBranch[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return httpClient.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches`).pipe(
      map((data: any) => {
        const branches = [];
        data.forEach(b => {
          const nb = { ...b };
          nb.commit.sha = b.commit.id;
          branches.push(nb);
        });
        return branches;
      })
    );
  }

  getCommit(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit> {
    return httpClient.get(this.getCommitApiUrl(projectName, commitSha)).pipe(
      map(data => {
        return this.convertCommit(projectName, data);
      })
    );
  }

  getCommitApiUrl(projectName: string, commitSha: string, ): string {
    const prjNameEncoded = encodeURIComponent(projectName);
    return `${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits/${commitSha}`;
  }

  getCommits(httpClient: HttpClient, projectName: string, commitSha: string): Observable<GitCommit[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return httpClient.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits?ref_name=${commitSha}`).pipe(
      map((data: any) => {
        const commits = [];
        data.forEach(c => commits.push(this.convertCommit(projectName, c)));
        return commits;
      })
    );
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
    let url = `${gitLabAPIUrl}/projects?search=${projectName}`;
    if (prjParts.length > 1) {
      url = `${gitLabAPIUrl}/users/${prjParts[0]}/projects?search=${prjParts[1]}`;
    }
    return httpClient.get(url).pipe(
      map((repos: any) => {
        return repos.map(item => item.path_with_namespace);
      })
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
