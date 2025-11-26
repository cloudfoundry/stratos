import type { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';
import { ListDataSource, type IListConfig } from '@stratosui/core';
import type { AppState } from '../../../../../../../store/src/app-state';
import { GitEntitySchema } from '../../../../../store/git-entity-factory';
import { gitEntityCatalog } from '../../../../../store/git-entity-generator';
import type { GitCommit } from '../../../../../store/git.public-types';
import type { GitMeta, GitSCM } from '../../../../scm/scm';


export class GithubCommitsDataSource extends ListDataSource<GitCommit> {
  declare store: Store<AppState>;

  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<GitCommit>,
    scm: GitSCM,
    projectName: string,
    sha: string,
    commitSha?: string,
  ) {
    const gitMeta: GitMeta = {
      scm,
      projectName,
      commitSha: sha
    };
    const action = gitEntityCatalog.commit.actions.getMultiple(sha, null, gitMeta);
    const paginationKey = action.paginationKey;
    const rowsState = observableOf(commitSha ? {
      [commitSha]: {
        highlighted: true
      }
    } : {});
    super({
      store,
      action,
      schema: new GitEntitySchema(action.entityType),
      getRowUniqueId: (object: GitCommit) => object.sha,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig,
      rowsState
    });
  }
}
