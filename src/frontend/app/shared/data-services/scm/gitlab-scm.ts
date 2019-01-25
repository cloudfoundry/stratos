import { GitSCM, SCMIcon } from './scm';
import { Observable, of as observableOf } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Http } from '@angular/http';
import { GitSCMType } from './scm.service';
import { Md5 } from 'ts-md5/dist/md5';
import { GitRepo, GitCommit, GitBranch } from '../../../store/types/git.types';

const gitLabAPIUrl = 'https://gitlab.com/api/v4';

export class GitLabSCM implements GitSCM {

  constructor(public http: Http) {}

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

  getRepository(projectName: string): Observable<GitRepo> {
    const parts = projectName.split('/');

    let obs$ = this.http.get(`${gitLabAPIUrl}/users/${parts[0]}/projects?search=${parts[1]}`);
    if (parts.length !== 2) {
      obs$ = observableOf(null);
    }

    return obs$.pipe(
      map((response: any) => {
        const data = response.json();
        if (data.length !== 1) {
          throw new HttpErrorResponse({
            status: 404
          });
        }
        return this.convertProject(data[0]);
      })
    );
  }

  getBranches(projectName: string): Observable<GitBranch[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.http.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/branches`).pipe(
      map(response => {
        const data = response.json();
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

  getCommit(projectName: string, commitSha: string): Observable<GitCommit> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.http.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits/${commitSha}`).pipe(
      map(response => {
        return this.convertCommit(projectName, response.json());
      })
    );
  }

  getCommits(projectName: string, commitSha: string): Observable<GitCommit[]> {
    const prjNameEncoded = encodeURIComponent(projectName);
    return this.http.get(`${gitLabAPIUrl}/projects/${prjNameEncoded}/repository/commits?ref_name=${commitSha}`).pipe(
      map(response => {
        const commits = [];
        response.json().forEach(c => commits.push(this.convertCommit(projectName, c)));
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

  private convertProject(prj: any): GitRepo {
    return {
      ...prj,
      full_name: prj.path_with_namespace,
      description: prj.description || prj.name_with_namespace,
      html_url: prj.web_url,
      owner: {
        name: prj.namespace.name,
        avatar_url: prj.avatar_url || '/assets/gitlab-logo.svg'
      }
    };
  }

  private convertCommit(projectName: string, commit: any): GitCommit {
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
