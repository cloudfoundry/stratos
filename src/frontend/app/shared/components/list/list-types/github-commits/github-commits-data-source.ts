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

export class GithubCommitsDataSource extends ListDataSource<GithubCommit> {
  store: Store<AppState>;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<GithubCommit>,
    projectName: string
  ) {
    const action = new FetchCommits(projectName);
    const paginationKey = projectName;
    super({
      store,
      action,
      schema: new EntitySchema(githubCommitSchemaKey),
      getRowUniqueId: object => object.sha,
      paginationKey,
      isLocal: true,
      transformEntities: [
        {
          type: 'filter',
          field: 'name'
        },
      ],
      listConfig
    });
  }
}
