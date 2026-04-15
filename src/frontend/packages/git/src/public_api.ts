/*
 * Public API Surface of git
 */

export * from './git-package.module';
export * from './git-routing.module';
export * from './git.routes';
export * from './shared/git-shared.module';

export * from './store/git.public-types';
export * from './shared/scm/scm.service';
export * from './shared/scm/scm';
export { BaseSCM } from './shared/scm/scm-base';
export { GitHubSCM } from './shared/scm/github-scm';
export * from './shared/github.helpers';
export * from './store/git-entity-factory';
export * from './store/git-entity-generator';
export * from './shared/components/list/list-types/github-commits/github-commits-data-source';
export * from './shared/components/list/list-types/github-commits/github-commits-list-config-base.service';
export * from './shared/components/github-commit-author/github-commit-author.component';
