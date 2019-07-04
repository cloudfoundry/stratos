import { IRequestAction } from '../../../store/src/types/request.types';
import { OrchestratedActionBuilders } from '../../../core/src/core/entity-catalogue/action-orchestrator/action-orchestrator';

interface CFOrchestratedActionBuilders extends OrchestratedActionBuilders {
  get(
    guid: string,
    endpointGuid: string,
    includeRelations: string[],
    populateMissing: boolean
  ): IRequestAction;
}