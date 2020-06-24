import { SendEventAction } from '../../actions/internal-events.actions';
import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { endpointEntityType } from '../../helpers/stratos-entity-factory';
import { ApiRequestTypes, getFailApiRequestActions } from '../../reducers/api-request-reducer/request-helpers';
import { GLOBAL_EVENT, InternalEventSeverity, InternalEventStateMetadata } from '../../types/internal-events.types';
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
  // This will never work for calls where endpoint list is automatically generated (list is applied to request object not action)
  // For those cases treat as a global error
  const headerEndpointString = action.options.headers ? action.options.headers.get(PipelineHttpClient.EndpointHeader) : null;
  const endpointString = headerEndpointString || action.endpointGuid || null;
  const endpointIds: string[] = endpointString ? endpointString.split(',') : [];

  if (endpointString) {
    endpointIds.forEach(endpoint =>
      actionDispatcher(
        new SendEventAction<InternalEventStateMetadata>(endpointEntityType, endpoint, {
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
  } else {
    // See #4054, in theory we should never hit this as we always know the endpoint id's
    actionDispatcher(
      new SendEventAction<InternalEventStateMetadata>(GLOBAL_EVENT, catalogEntity.entityKey, {
        eventCode: error.status ? error.status + '' : '500',
        severity: InternalEventSeverity.ERROR,
        message: 'Jetstream API request error',
        metadata: {
          httpMethod: action.options.method as string,
          errorResponse: error,
          url: error.url || action.options.url,
        },
      }),
    );
  }

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
