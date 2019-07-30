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
    const action = new FetchCommits(scm, projectName, sha);
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
