import { EntityRequestAction } from '../../types/request.types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { SendEventAction } from '../../actions/internal-events.actions';
import { endpointSchemaKey } from '../../helpers/entity-factory';
import { InternalEventSeverity } from '../../types/internal-events.types';
import { getFailApiRequestActions, ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { ActionDispatcher } from '../entity-request-pipeline.types';
import { PipelineHttpClient } from '../pipline-http-client.service';

export function jetstreamErrorHandler(
  error: any,
  action: EntityRequestAction,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  actionDispatcher: ActionDispatcher,
  recursivelyDeleting: boolean
) {
  const endpointString = action.options.headers ? action.options.headers.get(PipelineHttpClient.EndpointHeader) || '' : '';
  const endpointIds: string[] = endpointString.split(',');
  endpointIds.forEach(endpoint =>
    actionDispatcher(
      new SendEventAction(endpointSchemaKey, endpoint, {
        eventCode: error.status ? error.status + '' : '500',
        severity: InternalEventSeverity.ERROR,
        message: 'Jetstream API request error',
        metadata: {
          error,
          url: error.url || action.options.url,
        },
      }),
    ),
  );
  const errorActions = getFailApiRequestActions(action, error, requestType, catalogueEntity, {
    endpointIds,
    url: error.url || action.options.url,
    eventCode: error.status ? error.status + '' : '500',
    message: 'Jetstream API request error',
    error
  });
  if (recursivelyDeleting) {
    actionDispatcher(new RecursiveDeleteFailed(
      action.guid,
      action.endpointGuid,
      catalogueEntity.getSchema(action.schemaKey),
    ));
  }
  return errorActions;
}
