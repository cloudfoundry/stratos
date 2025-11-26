import { SendEventAction } from '../../actions/internal-events.actions';
import type { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { endpointEntityType } from '../../helpers/stratos-entity-factory';
import type { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { InternalEventSeverity, type InternalEventStateMetadata } from '../../types/internal-events.types';
import { APISuccessOrFailedAction, type EntityRequestAction } from '../../types/request.types';
import type { ActionDispatcher } from '../entity-request-pipeline.types';
import type { JetstreamError } from './handle-multi-endpoints.pipe';

export const endpointErrorsHandlerFactory = (actionDispatcher: ActionDispatcher) => (
  action: EntityRequestAction,
  catalogEntity: StratosBaseCatalogEntity,
  requestType: ApiRequestTypes,
  errors: JetstreamError[]
) => {
  errors.forEach(error => {
    const entityErrorAction = catalogEntity.getRequestAction('failure', action, requestType);
    // Dispatch a error action for the specific endpoint that's failed
    const fakedAction = { ...action, endpointGuid: error.guid };
    const errorMessage = error.jetstreamErrorResponse
      ? error.jetstreamErrorResponse.error.status || 'API request error'
      : 'API request error';
    actionDispatcher(
      new APISuccessOrFailedAction(
        entityErrorAction.type,
        fakedAction,
        errorMessage,
      )
    );
    actionDispatcher(
      new SendEventAction<InternalEventStateMetadata>(endpointEntityType, error.guid, {
        eventCode: error.errorCode,
        severity: InternalEventSeverity.ERROR,
        message: errorMessage,
        metadata: {
          url: error.url,
          httpMethod: action.options ? action.options.method as string : '',
          errorResponse: {
            errorResponse: error.jetstreamErrorResponse
          },
        },
      }),
    );
  });
};
