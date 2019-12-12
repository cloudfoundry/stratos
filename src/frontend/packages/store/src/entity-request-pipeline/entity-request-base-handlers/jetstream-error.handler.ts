import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity';
import { SendEventAction } from '../../actions/internal-events.actions';
import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { endpointSchemaKey } from '../../helpers/entity-factory';
import { ApiRequestTypes, getFailApiRequestActions } from '../../reducers/api-request-reducer/request-helpers';
import { InternalEventSeverity, InternalEventStateMetadata } from '../../types/internal-events.types';
import { EntityRequestAction } from '../../types/request.types';
import { ActionDispatcher } from '../entity-request-pipeline.types';
import { PipelineHttpClient } from '../pipline-http-client.service';


export function jetstreamErrorHandler(
  error: any,
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes,
  actionDispatcher: ActionDispatcher,
  recursivelyDeleting: boolean
) {
  const endpointString = action.options.headers ? action.options.headers.get(PipelineHttpClient.EndpointHeader) || '' : '';
  const endpointIds: string[] = endpointString.split(',');
  endpointIds.forEach(endpoint =>
    actionDispatcher(
      new SendEventAction<InternalEventStateMetadata>(endpointSchemaKey, endpoint, {
        eventCode: error.status ? error.status + '' : '500',
        severity: InternalEventSeverity.ERROR,
        message: 'Jetstream API request error',
        metadata: {
          httpMethod: action.options.method as string,
          errorResponse: error,
          url: error.url || action.options.url,
        },
      }),
    ),
  );
  const errorActions = getFailApiRequestActions(action, error, requestType, catalogEntity, {
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
      catalogEntity.getSchema(action.schemaKey),
    ));
  }
  return errorActions;
}
