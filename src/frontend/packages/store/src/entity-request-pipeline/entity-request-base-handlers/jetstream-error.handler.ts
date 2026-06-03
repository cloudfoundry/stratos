import { RecursiveDeleteFailed } from '../../effects/recursive-entity-delete.effect';
import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ApiRequestTypes, getFailApiRequestActions } from '../../reducers/api-request-reducer/request-helpers';
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
  // Don't dispatch error events for expected 404s (e.g., autoscaler plugin not installed)
  const url = error.url || action.options.url;
  const isExpected404 = error.status === 404 && url?.includes('/autoscaler/');

  if (isExpected404) {
    // Skip event dispatch for expected autoscaler 404s - plugin may not be installed
    const errorActions = getFailApiRequestActions(action, error, requestType, catalogEntity, {
      endpointIds: [],
      url,
      eventCode: '404',
      message: 'Autoscaler plugin not available',
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

  // This will never work for calls where endpoint list is automatically generated (list is applied to request object not action)
  // For those cases treat as a global error
  const headerEndpointString = action.options.headers ? action.options.headers.get(PipelineHttpClient.EndpointHeader) : null;
  const endpointString = headerEndpointString || action.endpointGuid || null;
  const endpointIds: string[] = endpointString ? endpointString.split(',') : [];

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
