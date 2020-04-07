import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { CFEntitySchema } from '../../../../../../../cloud-foundry/src/cf-entity-schema-types';
import { gitCommitEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { CF_ENDPOINT_TYPE } from '../../../../../../../cloud-foundry/src/cf-types';
import { GitMeta } from '../../../../../../../cloud-foundry/src/entity-action-builders/git-action-builder';
import { GitCommit } from '../../../../../../../cloud-foundry/src/store/types/git.types';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog.service';
import { GitSCM } from '../../../../data-services/scm/scm';
import { ListDataSource } from '../../data-sources-controllers/list-data-source';
import { IListConfig } from '../../list.component.types';



export class GithubCommitsDataSource extends ListDataSource<GitCommit> {
  store: Store<CFAppState>;

  /**
   * Creates an instance of GithubCommitsDataSource.
   * @param projectName For example `cloudfoundry-incubator/stratos`
   * @param sha Branch name, tag, etc
   */
  constructor(
    store: Store<CFAppState>,
    listConfig: IListConfig<GitCommit>,
    scm: GitSCM,
    projectName: string,
    sha: string,
    commitSha?: string,
  ) {
    const gitCommitEntity = entityCatalog.getEntity(CF_ENDPOINT_TYPE, gitCommitEntityType);
    const fetchCommitActionBuilder = gitCommitEntity.actionOrchestrator.getActionBuilder('getMultiple');
    const gitMeta: GitMeta = {
      scm,
      projectName,
      commitSha: sha
    };
    const fetchCommitAction = fetchCommitActionBuilder(sha, null, gitMeta);
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
      getRowUniqueId: (object: GitCommit) => object.sha,
      paginationKey,
      isLocal: true,
      transformEntities: [],
      listConfig,
      rowsState
    });
  }
}
