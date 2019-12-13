import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { SendEventAction } from '../../actions/internal-events.actions';
import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { endpointSchemaKey } from '../../helpers/entity-factory';
import { ApiRequestTypes, getFailApiRequestActions } from '../../reducers/api-request-reducer/request-helpers';
import { GLOBAL_EVENT, InternalEventSeverity, InternalEventStateMetadata } from '../../types/internal-events.types';
import { EntityRequestAction } from '../../types/request.types';
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
  // This will never work for calls where endpoint list is automatically generated (list is applied to request object not action)
  // For those cases treat as a global error
  const endpointString = action.options.headers ? action.options.headers.get(PipelineHttpClient.EndpointHeader) || null : null;
  const endpointIds: string[] = endpointString ? endpointString.split(',') : [];

  if (endpointString) {
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
  } else {
    // See #4054, in theory we should never hit this as we always know the endpoint id's
    actionDispatcher(
      new SendEventAction<InternalEventStateMetadata>(GLOBAL_EVENT, catalogueEntity.entityKey, {
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
