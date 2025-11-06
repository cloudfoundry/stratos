import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Action } from '@ngrx/store';

import { SendEventAction } from '../../actions/internal-events.actions';
import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntitySchema } from '../../helpers/entity-schema';
import { InternalEventSeverity } from '../../types/internal-events.types';
import { APISuccessOrFailedAction, EntityRequestAction } from '../../types/request.types';
import { endpointErrorsHandlerFactory } from './endpoint-errors.handler';
import { JetstreamError } from './handle-multi-endpoints.pipe';


describe('endpoint-error-handler', () => {
  it('correct actions are fired', () => {
    const entityType = 'key';

    const entity = new StratosBaseCatalogEntity({
      type: entityType,
      schema: new EntitySchema(
        entityType,
        'endpoint'
      ),
      label: 'Entity',
      labelPlural: 'Entities',
    });
    const endpointGuid = '123GUID';
    const requestType = 'fetch';
    const error = new JetstreamError(
      '500',
      endpointGuid,
      'url',
      {
        error: {
          status: 'test',
          statusCode: 200
        },
        errorResponse: 'response'
      }
    );
    const actions: Action[] = [];
    const actionDispatcher = (action: Action) => {
      actions.push(action);
    };

    const errors = [error];
    const errorHandler = endpointErrorsHandlerFactory(actionDispatcher);
    errorHandler(
      { type: 'test', guid: endpointGuid } as EntityRequestAction,
      entity,
      requestType,
      errors
    );

    // Verify both actions were dispatched
    expect(actions.length).toBe(2);

    // Check first action
    const successOrFailure = actions[0] as APISuccessOrFailedAction;
    expect(successOrFailure instanceof APISuccessOrFailedAction).toBe(true);
    expect(successOrFailure.response).toBe(error.jetstreamErrorResponse.error.status);
    expect(successOrFailure.apiAction.endpointGuid).toBe(endpointGuid);
    expect(successOrFailure.apiAction.type).toBe('test');
    expect(successOrFailure.type).toBe(entity.getRequestAction('failure', requestType).type);

    // Check second action
    const eventAction = actions[1] as SendEventAction;
    expect(eventAction instanceof SendEventAction).toBe(true);
    expect(eventAction.eventState.eventCode).toBe(error.errorCode);
    expect(eventAction.eventState.severity).toBe(InternalEventSeverity.ERROR);
    expect(eventAction.eventState.message).toBe('test');
    expect(eventAction.eventState.metadata.url).toBe(error.url);
    expect(eventAction.eventState.metadata.errorResponse.errorResponse).toEqual(error.jetstreamErrorResponse);
  });
});
