import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import {
  ListDataSource,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { IListConfig } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { GitEntitySchema } from '../../../../../store/git-entity-factory';
import { gitEntityCatalog } from '../../../../../store/git-entity-generator';
import { GitCommit } from '../../../../../store/git.public-types';
import { GitMeta, GitSCM } from '../../../../scm/scm';


export class GithubCommitsDataSource extends ListDataSource<GitCommit> {
  store: Store<AppState>;

  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param projectName For example `cloudfoundry-community/stratos`
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
