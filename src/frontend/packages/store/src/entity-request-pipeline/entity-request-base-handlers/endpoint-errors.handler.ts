import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { SendEventAction } from '../../actions/internal-events.actions';
import { endpointSchemaKey } from '../../helpers/entity-factory';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { InternalEventSeverity } from '../../types/internal-events.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../../types/request.types';
import { ActionDispatcher } from '../entity-request-pipeline.types';
import { JetstreamError } from './handle-multi-endpoints.pipe';

export const endpointErrorsHandlerFactory = (actionDispatcher: ActionDispatcher) => (
  action: EntityRequestAction,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  errors: JetstreamError[]
) => {
  errors.forEach(error => {
    const entityErrorAction = catalogueEntity.getRequestAction('failure', requestType);
    // Dispatch a error action for the specific endpoint that's failed
    const fakedAction = { ...action, endpointGuid: error.guid };
    const errorMessage = error.errorResponse
      ? error.errorResponse.description || error.errorCode
      : error.errorCode;
    actionDispatcher(
      new APISuccessOrFailedAction(
        entityErrorAction.type,
        fakedAction,
        errorMessage,
      )
    );
    actionDispatcher(
      new SendEventAction(endpointSchemaKey, error.guid, {
        eventCode: error.errorCode,
        severity: InternalEventSeverity.ERROR,
        message: 'API request error',
        metadata: {
          url: error.url,
          errorResponse: error.errorResponse,
        },
      }),
    );
  });
};
