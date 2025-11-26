import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntitySchema } from '../../helpers/entity-schema';
import type { EntityRequestAction } from '../../types/request.types';
import { failedEntityHandler } from './fail-entity-request.handler';

describe('failedEntityHandlers', () => {
  it('Should dispatch actions', () => {
    const catalogEntity = new StratosBaseCatalogEntity({
      type: 'test',
      schema: new EntitySchema(
        'test',
        'endpoint'
      ),
      label: 'Entity',
      labelPlural: 'Entities',
    });
    const spyDispatcher = vi.fn();
    failedEntityHandler(
      spyDispatcher,
      catalogEntity,
      'fetch',
      {
        endpointType: 'end',
        entityType: 'ent',
        type: 'type',
      } as EntityRequestAction,
      {
        success: false,
      },
      false,
    );
    expect(spyDispatcher).toHaveBeenCalledTimes(2);
  });
  it('Should dispatch actions with recursive delete', () => {
    const catalogEntity = new StratosBaseCatalogEntity({
      type: 'test',
      schema: new EntitySchema(
        'test',
        'endpoint'
      ),
      label: 'Entity',
      labelPlural: 'Entities',
    });
    const spyDispatcher = vi.fn();
    failedEntityHandler(
      spyDispatcher,
      catalogEntity,
      'fetch',
      {
        endpointType: 'end',
        entityType: 'ent',
        type: 'type',
      } as EntityRequestAction,
      {
        success: false,
      },
      true,
    );
    expect(spyDispatcher).toHaveBeenCalledTimes(3);
  });
});
