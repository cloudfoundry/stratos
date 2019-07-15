import { NormalizedResponse } from '../../src/types/api.types';

export const multiEndpointResponseMergePipe = (
  normalizedData: NormalizedResponse[]
): NormalizedResponse => {
  return normalizedData.reduce((allEntities, endpointData) => {
    return Object.keys(endpointData.entities).reduce((oldEntities, entityType) => {
      const entities = {
        ...oldEntities.entities,
        [entityType]: {
          ...oldEntities.entities[entityType] || [],
          ...endpointData.entities[entityType]
        }
      };
      const result = [
        ...oldEntities.result,
        ...Object.keys(endpointData.entities[entityType])
      ];
      return {
        entities,
        result
      };
    }, allEntities);
  }, {
    entities: {},
    result: []
  } as NormalizedResponse);
};

