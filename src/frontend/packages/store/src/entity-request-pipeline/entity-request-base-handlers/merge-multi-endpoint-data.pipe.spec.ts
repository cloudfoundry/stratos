import { NormalizedResponse } from '../../types/api.types';
import { multiEndpointResponseMergePipe } from './merge-multi-endpoint-data.pipe';

describe('merge-multi-endpoint-data', () => {
  it('should merge correctly', () => {
    const data1 = {
      entities: {
        entity1: {
          guid1: {},
          guid2: {}
        },
        entity3: {
          guid1: {},
          guid2: {}
        }
      },
      result: ['guid1', 'guid2']
    } as NormalizedResponse;
    const data2 = {
      entities: {
        entity1: {
          guid3: {},
          guid4: {}
        },
        entity2: {
          entity2Guid1: {},
          entity2Guid2: {}
        }
      },
      result: ['guid3', 'guid4']
    } as NormalizedResponse;
    const expectedEntities = {
      entity1: new Set(['guid1', 'guid2', 'guid3', 'guid4']),
      entity2: new Set(['entity2Guid1', 'entity2Guid2']),
      entity3: new Set(['guid1', 'guid2'])
    };
    const expectedResult = new Set(['guid1', 'guid2', 'guid3', 'guid4']);
    const merged = multiEndpointResponseMergePipe([{
      response: data1,
      success: true
    }, {
      response: data2,
      success: true
    }]);

    Object.keys(merged.response.entities).forEach(entityKey => {
      const entities = merged.response.entities[entityKey];
      const expectedEntitiesSet = expectedEntities[entityKey] as Set<string>;
      Object.keys(entities).forEach(entityGuid => {
        expectedEntitiesSet.delete(entityGuid);
      });

    });
    merged.response.result.forEach((key) => {
      expectedResult.delete(key);
    });
    Object.values(expectedEntities).forEach(set => {
      expect(set.size).toBe(0);
    });
    expect(expectedResult.size).toBe(0);
  });
});
