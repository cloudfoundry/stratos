import type { IRequestEntityTypeState } from '../../app-state';
import type { PipelineResult } from '../entity-request-pipeline.types';

export const multiEndpointResponseMergePipe = (
  results: PipelineResult[]
): PipelineResult => {
  return results.reduce((allEntities, endpointData) => {
    const entities = mergeEntities(
      endpointData.response.entities as IRequestEntityTypeState<{ [entityKey: string]: unknown }>,
      allEntities.response.entities as IRequestEntityTypeState<{ [entityKey: string]: unknown }>
    );
    return {
      success: null,
      response: {
        entities,
        result: Array.from(new Set([
          ...allEntities.response.result,
          ...endpointData.response.result
        ])),
      },
      totalPages: allEntities.totalPages + endpointData.totalPages,
      totalResults: allEntities.totalResults + endpointData.totalResults
    };
  }, {
      success: null,
      response: {
        entities: {} as IRequestEntityTypeState<{ [entityKey: string]: unknown }>,
        result: []
      },
      totalPages: 0,
      totalResults: 0
    } as PipelineResult);
};


function mergeEntities(
  entities: IRequestEntityTypeState<{ [entityKey: string]: unknown }>,
  allEntities: IRequestEntityTypeState<{ [entityKey: string]: unknown }>
): IRequestEntityTypeState<{ [entityKey: string]: unknown }> {
  return Object.keys(entities).reduce((entitiesAcc, entityType) => {
    const accTyped = entitiesAcc as Record<string, unknown>;
    const entitiesTyped = entities as Record<string, unknown>;
    return {
      ...entitiesAcc,
      [entityType]: {
        ...(accTyped[entityType] as Record<string, unknown> || {}),
        ...(entitiesTyped[entityType] as Record<string, unknown>)
      }
    };
  }, allEntities);
}
