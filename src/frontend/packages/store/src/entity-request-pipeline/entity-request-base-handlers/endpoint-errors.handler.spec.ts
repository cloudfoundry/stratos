import { Action } from '@ngrx/store';
import { SendEventAction } from '../../actions/internal-events.actions';
import { InternalEventSeverity } from '../../types/internal-events.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../../types/request.types';
import { endpointErrorsHandlerFactory } from './endpoint-errors.handler';
import { JetstreamError } from './handle-multi-endpoints.pipe';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { EntitySchema } from '../../helpers/entity-schema';


describe('endpoint-error-handler', () => {
  it('correct actions are fried', (done) => {
    const entityType = 'key';

    const entity = new StratosBaseCatalogueEntity({
      type: entityType,
      schema: new EntitySchema(
        entityType,
        'endpoint'
      ),
      label: 'Entity',
      labelPlural: 'Entities',
    });
    console.log(entity);
    const endpointGuid = '123GUID';
    const requestType = 'fetch';
    const error = new JetstreamError(
      '500',
      endpointGuid,
      'url',
      {
        code: 1,
        description: 'test',
        error_code: '200'
      }
    );
    const actionDispatcher = () => {
      let timesCalled = 0;
      return (action: Action) => {
        ++timesCalled;
        if (timesCalled === 1) {
          const successOrFailure = action as APISuccessOrFailedAction;
          expect(successOrFailure instanceof APISuccessOrFailedAction).toBe(true);
          expect(successOrFailure.response).toBe(error.errorResponse.description);
          expect(successOrFailure.apiAction.endpointGuid).toBe(endpointGuid);
          expect(successOrFailure.apiAction.type).toBe('test');
          expect(successOrFailure.type).toBe(entity.getRequestAction('failure', requestType).type);
        }
        if (timesCalled === 2) {
          const eventAction = action as SendEventAction;
          expect(eventAction instanceof SendEventAction).toBe(true);
          expect(eventAction.eventState.eventCode).toBe(error.errorCode);
          expect(eventAction.eventState.severity).toBe(InternalEventSeverity.ERROR);
          expect(eventAction.eventState.message).toBe('API request error');
          expect(eventAction.eventState.metadata.url).toBe(error.url);
          expect(eventAction.eventState.metadata.errorResponse).toBe(error.errorResponse);
          done();
        }
      };
    };
    const errors = [error];
    const errorHandler = endpointErrorsHandlerFactory(actionDispatcher());
    errorHandler(
      { type: 'test', guid: endpointGuid } as EntityRequestAction,
      entity,
      requestType,
      errors
    );
  });
});
