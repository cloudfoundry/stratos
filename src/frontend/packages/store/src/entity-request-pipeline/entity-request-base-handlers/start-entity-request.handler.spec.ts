import { StratosBaseCatalogueEntity } from '../../entity-catalog/entity-catalogue-entity';
import { EntitySchema } from '../../helpers/entity-schema';
import { EntityRequestAction } from '../../types/request.types';
import { startEntityHandler } from './start-entity-request.handler';

describe('startEntityHandler', () => {
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
    startEntityHandler(
      spyDispatcher,
      catalogueEntity,
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
