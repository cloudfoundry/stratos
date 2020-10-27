import { StratosBaseCatalogEntity } from '../../entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { EntitySchema } from '../../helpers/entity-schema';
import { EntityRequestAction } from '../../types/request.types';
import { startEntityHandler } from './start-entity-request.handler';

describe('startEntityHandler', () => {
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
    const spyDispatcher = jasmine.createSpy();
    startEntityHandler(
      spyDispatcher,
      catalogEntity,
      'fetch',
      {
        endpointType: 'end',
        entityType: 'ent',
        type: 'type',
      } as EntityRequestAction
    );
    expect(spyDispatcher).toHaveBeenCalledTimes(2);
  });
});
