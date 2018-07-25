import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { FetchCommits } from '../../../../../store/actions/deploy-applications.actions';
import { AppState } from '../../../../../store/app-state';
import { EntitySchema, githubCommitSchemaKey } from '../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../store/types/api.types';
import { GithubCommit } from '../../../../../store/types/github.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';


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
