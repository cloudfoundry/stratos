import { IRequestAction } from '../types/request.types';
import {
    EnvVarStratosProject
} from '../../../core/src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { gitRepoSchemaKey } from '../helpers/entity-factory';

export const FETCH_GITHUB_REPO = '[Github] Fetch Github repo details';

export class FetchGitHubRepoInfo implements IRequestAction {
    constructor(public stProject: EnvVarStratosProject) { }
    type = FETCH_GITHUB_REPO;
    entityType = gitRepoSchemaKey;
}
