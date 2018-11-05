import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { GithubCommit } from '../../../../../../../store/src/types/github.types';
import { AppState } from '../../../../../../../store/src/app-state';
import { FetchCommits } from '../../../../../../../store/src/actions/deploy-applications.actions';
import { EntitySchema, githubCommitSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';


export class GithubCommitsDataSource extends ListDataSource<APIResource<GithubCommit>> {
  store: Store<AppState>;

  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param {Store<AppState>} store
   * @param {IListConfig<APIResource<GithubCommit>>} listConfig
   * @param {string} projectName For example `cloudfoundry-incubator/stratos`
   * @param {string} sha Branch name, tag, etc
   * @memberof GithubCommitsDataSource
   */
  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<APIResource<GithubCommit>>,
    projectName: string,
    sha: string,
    commitSha?: string,
  ) {
    const action = new FetchCommits(projectName, sha);
    const paginationKey = action.paginationKey;
    const rowsState = observableOf(commitSha ? {
      [commitSha]: {
        highlighted: true
      }
    } : {});
    super({
      store,
      action,
      schema: new EntitySchema(githubCommitSchemaKey),
      getRowUniqueId: object => object.entity.sha,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig,
      rowsState
    });
  }
}
