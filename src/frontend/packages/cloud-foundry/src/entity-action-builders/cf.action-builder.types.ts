import { OrchestratedActionBuilders } from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import { PaginatedAction } from '../../../store/src/types/pagination.types';
import { EntityRequestAction } from '../../../store/src/types/request.types';
import { CFBasePipelineRequestActionMeta } from '../cf-entity-generator';

export interface CFOrchestratedActionBuilders extends OrchestratedActionBuilders {
  get?(
    guid: string,
    endpointGuid: string,
    meta: CFBasePipelineRequestActionMeta
  ): EntityRequestAction;
  getMultiple?(
    paginationKey: string,
    endpointGuid: string,
    meta: CFBasePipelineRequestActionMeta
  ): PaginatedAction;
}
