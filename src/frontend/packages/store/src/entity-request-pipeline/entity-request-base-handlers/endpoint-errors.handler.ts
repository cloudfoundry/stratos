import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';
import { APISuccessOrFailedAction, EntityRequestAction } from '../../types/request.types';
import { ActionDispatcher } from '../entity-request-pipeline.types';
import { JetstreamError } from './handle-multi-endpoints.pipe';

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
  });
};
