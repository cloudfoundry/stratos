import { IRequestAction } from '../../../store/src/types/request.types';
import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';
import { PaginatedAction } from '../../../store/src/types/pagination.types';

export interface CFOrchestratedActionBuilders extends OrchestratedActionBuilders {
  get(
    guid: string,
    endpointGuid: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ): IRequestAction;
  getAll(
    paginationKey: string,
    endpointGuid: string,
    includeRelations?: string[],
    populateMissing?: boolean
  ): PaginatedAction;
}