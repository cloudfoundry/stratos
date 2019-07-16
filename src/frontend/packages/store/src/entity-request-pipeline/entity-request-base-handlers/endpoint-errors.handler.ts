import { Store } from '@ngrx/store';
import { AppState } from '../../app-state';
import { JetstreamError } from './handle-multi-endpoints.pipe';
import { SendEventAction } from '../../actions/internal-events.actions';
import { endpointSchemaKey } from '../../helpers/entity-factory';
import { InternalEventSeverity } from '../../types/internal-events.types';
import { EntityRequestAction, APISuccessOrFailedAction } from '../../types/request.types';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { ApiRequestTypes } from '../../reducers/api-request-reducer/request-helpers';

export const endpointErrorsHandlerFactory = (store: Store<AppState>) => (
  action: EntityRequestAction,
  catalogueEntity: StratosBaseCatalogueEntity,
  requestType: ApiRequestTypes,
  errors: JetstreamError[]
) => {
  errors.forEach(error => {
    const entityErrorAction = catalogueEntity.getRequestAction('failure', requestType)
    // Dispatch a error action for the specific endpoint that's failed
    const fakedAction = { ...action, endpointGuid: error.guid };
    const errorMessage = error.errorResponse
      ? error.errorResponse.description || error.errorCode
      : error.errorCode;
    this.store.dispatch(
      new APISuccessOrFailedAction(
        entityErrorAction,
        fakedAction,
        errorMessage,
      ),
    );
    store.dispatch(
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
