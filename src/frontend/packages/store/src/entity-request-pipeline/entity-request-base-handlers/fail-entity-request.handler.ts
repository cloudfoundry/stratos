import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { EntityRequestAction, WrapperRequestActionFailed } from '../../types/request.types';
import { ActionDispatcher, PipelineResult } from '../entity-request-pipeline.types';

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
  actionDispatcher(new WrapperRequestActionFailed(response.errorMessage || 'API Request Failure', action, requestType, null, response));
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
