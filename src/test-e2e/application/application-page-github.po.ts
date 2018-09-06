import { ListComponent } from '../po/list.po';
import { ApplicationBasePage } from './application-page.po';
import { CardGithubCommitInfo } from './po/card-github-commit-info.po';
import { CardGithubDeployInfo } from './po/card-github-deploy-info.po';
import { CardGithubRepoInfo } from './po/card-github-repo-info.po';

export class ApplicationPageGithubTab extends ApplicationBasePage {

  commits: ListComponent;
  cardDeploymentInfo: CardGithubDeployInfo;
  cardRepoInfo: CardGithubRepoInfo;
  cardCommitInfo: CardGithubCommitInfo;

  constructor(public cfGuid: string, public appGuid: string) {
    super(cfGuid, appGuid, 'github');
    this.commits = new ListComponent();
    this.cardDeploymentInfo = new CardGithubDeployInfo();
    this.cardRepoInfo = new CardGithubRepoInfo();
    this.cardCommitInfo = new CardGithubCommitInfo();
  }

}
