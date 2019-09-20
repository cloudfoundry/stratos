import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { WrapperRequestActionFailed, EntityRequestAction } from '../../types/request.types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ActionDispatcher, PipelineResult } from '../entity-request-pipeline.types';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';

export function failedEntityHandler(
  actionDispatcher: ActionDispatcher,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  response: PipelineResult,
  recursivelyDeleting: boolean = false
) {
  const entityAction = catalogueEntity.getRequestAction('failure', action, requestType);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionFailed('Api Request Failed', action, requestType, null, response));
  if (recursivelyDeleting) {
    actionDispatcher(
      new RecursiveDeleteFailed(
        action.guid,
        action.endpointGuid,
        catalogueEntity.getSchema(action.schemaKey)
      ),
    );
  }
}
