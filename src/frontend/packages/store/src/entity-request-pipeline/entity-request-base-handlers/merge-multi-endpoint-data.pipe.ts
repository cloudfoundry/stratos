import { IRequestEntityTypeState } from '../../app-state';
import { PipelineResult } from '../entity-request-pipeline.types';

export const multiEndpointResponseMergePipe = (
  results: PipelineResult[]
): PipelineResult => {
  return results.reduce((allEntities, endpointData) => {
    const entities = mergeEntities(endpointData.response.entities, allEntities.response.entities);
    return {
      success: null,
      response: {
        entities,
        result: [
          ...allEntities.response.result,
          ...endpointData.response.result
        ],
      },
      totalPages: allEntities.totalPages + endpointData.totalPages,
      totalResults: allEntities.totalResults + endpointData.totalResults
    };
  }, {
      success: null,
      response: {
        entities: {},
        result: []
      },
      totalPages: 0,
      totalResults: 0
    });
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
