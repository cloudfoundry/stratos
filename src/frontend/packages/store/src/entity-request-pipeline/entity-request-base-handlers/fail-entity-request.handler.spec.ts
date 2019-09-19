import { failedEntityHandler } from './fail-entity-request.handler';
import { StratosBaseCatalogueEntity } from '../../../../core/src/core/entity-catalogue/entity-catalogue-entity';
import { EntitySchema } from '../../helpers/entity-schema';
import { EntityRequestAction } from '../../types/request.types';

describe('failedEntityHandlers', () => {
  it('Should dispatch actions', () => {
    const catalogueEntity = new StratosBaseCatalogueEntity({
      type: 'test',
      schema: new EntitySchema(
        'test',
        'endpoint'
      ),
      label: 'Entity',
      labelPlural: 'Entities',
    });
    const spyDispatcher = jasmine.createSpy();
    failedEntityHandler(
      spyDispatcher,
      catalogueEntity,
      'fetch',
      {
        endpointType: 'end',
        entityType: 'ent',
        type: 'type',
      } as EntityRequestAction,
      {
        success: false
      },
      false
    );
    expect(spyDispatcher).toHaveBeenCalledTimes(2);
  });
  it('Should dispatch actions with recursive delete', () => {
    const catalogueEntity = new StratosBaseCatalogueEntity({
      type: 'test',
      schema: new EntitySchema(
        'test',
        'endpoint'
      ),
      label: 'Entity',
      labelPlural: 'Entities',
    });
    const spyDispatcher = jasmine.createSpy();
    failedEntityHandler(
      spyDispatcher,
      catalogueEntity,
      'fetch',
      {
        endpointType: 'end',
        entityType: 'ent',
        type: 'type',
      } as EntityRequestAction,
      {
        success: false
      },
      true
    );
    expect(spyDispatcher).toHaveBeenCalledTimes(3);
  });
});
