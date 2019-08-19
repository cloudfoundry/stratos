import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { CFEntitySchema, gitCommitEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-factory';
import { FetchCommits } from '../../../../../../../cloud-foundry/src/actions/deploy-applications.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { GitCommit } from '../../../../../../../cloud-foundry/src/store/types/git.types';
import { GitSCM } from '../../../../data-services/scm/scm';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';
import { entityCatalogue } from '../../../../../core/entity-catalogue/entity-catalogue.service';
import { STRATOS_ENDPOINT_TYPE } from '../../../../../base-entity-schemas';
import { PaginatedAction } from '../../../../../../../store/src/types/pagination.types';


export class GithubCommitsDataSource extends ListDataSource<APIResource<GitCommit>> {
  store: Store<CFAppState>;

  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<APIResource<GitCommit>>,
    scm: GitSCM,
    projectName: string,
    sha: string,
    commitSha?: string,
  ) {
    const gitCommitEntity = entityCatalogue.getEntity(STRATOS_ENDPOINT_TYPE, gitCommitEntityType);
    const fetchCommitActionBuilder = gitCommitEntity.actionOrchestrator.getActionBuilder('fetchCommit');
    const fetchCommitAction = fetchCommitActionBuilder(scm, projectName, sha) as PaginatedAction;
    const action = fetchCommitAction;
    const paginationKey = action.paginationKey;
    const rowsState = observableOf(commitSha ? {
      [commitSha]: {
        highlighted: true
      }
    } : {});
    super({
      store,
      action,
      schema: new CFEntitySchema(gitCommitEntityType),
      getRowUniqueId: object => object.entity.sha,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig,
      rowsState
    });
  }
}
