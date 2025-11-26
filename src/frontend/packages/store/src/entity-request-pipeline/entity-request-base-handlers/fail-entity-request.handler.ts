import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import type { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import type { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { type EntityRequestAction, WrapperRequestActionFailed } from '../../types/request.types';
import type { ActionDispatcher, PipelineResult } from '../entity-request-pipeline.types';

export function failedEntityHandler(
  actionDispatcher: ActionDispatcher,
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes,
  action: EntityRequestAction,
  response: PipelineResult,
  recursivelyDeleting: boolean = false
) {
  const entityAction = catalogEntity.getRequestAction('failure', action, requestType);
  actionDispatcher(entityAction);
  actionDispatcher(new WrapperRequestActionFailed(response.errorMessage || 'API Request Failure', action, requestType, null, response));
  if (recursivelyDeleting) {
    actionDispatcher(
      new RecursiveDeleteFailed(
        action.guid,
        action.endpointGuid,
        catalogEntity.getSchema(action.schemaKey)
      ),
    );
  }
}
