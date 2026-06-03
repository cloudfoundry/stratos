import { describe, it, expect } from 'vitest';
import { Action } from '@ngrx/store';

import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntitySchema } from '../../helpers/entity-schema';
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
          statusCode: 200,
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
      errors,
    );

    // Only the request-state failure action is dispatched now; the
    // internal-events bus (SendEventAction) was removed — endpoint errors
    // surface via the signal-native EndpointErrorEventsService.
    expect(actions.length).toBe(1);

    const successOrFailure = actions[0] as APISuccessOrFailedAction;
    expect(successOrFailure instanceof APISuccessOrFailedAction).toBe(true);
    expect(successOrFailure.response).toBe(error.jetstreamErrorResponse.error.status);
    expect(successOrFailure.apiAction.endpointGuid).toBe(endpointGuid);
    expect(successOrFailure.apiAction.type).toBe('test');
    expect(successOrFailure.type).toBe(entity.getRequestAction('failure', requestType).type);
  });
});
