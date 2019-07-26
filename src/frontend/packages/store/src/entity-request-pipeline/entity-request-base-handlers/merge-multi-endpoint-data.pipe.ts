import { NormalizedResponse } from '../../types/api.types';
import { IRequestEntityTypeState } from '../../app-state';

export const multiEndpointResponseMergePipe = (
  normalizedData: NormalizedResponse[]
): NormalizedResponse => {
  return normalizedData.reduce((allEntities, endpointData) => {
    const entities = mergeEntities(endpointData.entities, allEntities.entities);
    return {
      entities,
      result: [
        ...allEntities.result,
        ...endpointData.result
      ]
    };
  }, {
    entities: {},
    result: []
  } as NormalizedResponse);
};


function mergeEntities(entities: IRequestEntityTypeState<any>, allEntities: IRequestEntityTypeState<any>) {
  return Object.keys(entities).reduce((entitiesAcc, entityType) => {
    return {
      ...entitiesAcc,
      [entityType]: {
        ...entitiesAcc[entityType] || [],
        ...entities[entityType]
      }
    };
  }, allEntities);
}
