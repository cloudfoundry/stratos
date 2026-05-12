import { of as observableOf } from 'rxjs';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { GitEntitySchema } from '../../../../../store/git-entity-factory';
import { gitEntityCatalog } from '../../../../../store/git-entity-generator';
import { GitCommit } from '../../../../../store/git.public-types';
import { GitMeta, GitSCM } from '../../../../scm/scm';

// Structural alias to avoid pulling in @ngrx/store from inside the git
// package — wave-3 git slice removes the ngrx surface, but the legacy
// ListDataSource (in core) still depends on a real Store at construction
// time. Callers pass through whatever store instance their host shell
// already has; we erase the ngrx type here so this package no longer
// names @ngrx/store directly.
type LegacyStoreLike = unknown;

export class GithubCommitsDataSource extends ListDataSource<GitCommit> {
  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(
    store: LegacyStoreLike,
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
      // Erased ngrx Store type at the package boundary; ListDataSource
      // (in core) still expects a real Store<AppState> instance, which
      // the caller provides — we just don't name @ngrx/store here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      store: store as any,
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
