import { Page, Locator } from '@playwright/test';
import { ApplicationBasePage } from '../application.page';

/**
 * Application GitHub Tab Page Object
 * Migrated from src/test-e2e/application/po/application-page-github.po.ts
 *
 * Represents the application GitHub tab with commit list and repo info
 */
export class ApplicationPageGithubTab extends ApplicationBasePage {
  private readonly commits: Locator;
  private readonly cardDeploymentInfo: Locator;
  private readonly cardRepoInfo: Locator;
  private readonly cardCommitInfo: Locator;

  constructor(page: Page, cfGuid: string, appGuid: string) {
    super(page, cfGuid, appGuid, 'gitscm');

    this.commits = page.locator('app-list');
    this.cardDeploymentInfo = page.locator('app-card-github-deploy-info');
    this.cardRepoInfo = page.locator('app-card-github-repo-info');
    this.cardCommitInfo = page.locator('app-card-github-commit-info');
  }

  /**
   * Get commits list
   */
  getCommits(): Locator {
    return this.commits;
  }

  /**
   * Get deployment info card
   */
  getCardDeploymentInfo(): Locator {
    return this.cardDeploymentInfo;
  }

  /**
   * Get repo info card
   */
  getCardRepoInfo(): Locator {
    return this.cardRepoInfo;
  }

  /**
   * Get commit info card
   */
  getCardCommitInfo(): Locator {
    return this.cardCommitInfo;
  }
}
