import { Store } from '@ngrx/store';

import { GetAllEndpoints } from '../../../../../store/actions/endpoint.actions';
import { CreatePagination } from '../../../../../store/actions/pagination.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, EntitySchema, githubCommitSchemaKey } from '../../../../../store/helpers/entity-factory';
import { endpointSchemaKey } from '../../../../../store/helpers/entity-factory';
import { EndpointModel } from '../../../../../store/types/endpoint.types';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { GithubCommit } from '../../../../../store/types/github.types';
import { FetchCommits } from '../../../../../store/actions/deploy-applications.actions';
import { APIResource } from '../../../../../store/types/api.types';
import { Observable } from 'rxjs/Observable';

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
    const rowsState = Observable.of(commitSha ? {
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
