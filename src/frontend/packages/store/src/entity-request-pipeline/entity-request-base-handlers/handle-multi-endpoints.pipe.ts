import { EntityRequestAction } from '../../types/request.types';
import { JetstreamResponse } from '../entity-request-pipeline.types';
import { isJetStreamError, JetStreamErrorResponse } from '../../../../core/src/jetstream.helpers';

export class JetstreamError {
  constructor(
    public errorCode: string,
    public guid: string,
    public url: string,
    public errorResponse?: JetStreamErrorInformation
  ) { }
}

interface JetStreamErrorInformation {
  code: number;
  description: string;
  error_code: string;
}

export interface HandledMultiEndpointResponse<T = any> {
  errors: JetstreamError[];
  successes: T[];
}


function mapResponses(jetstreamResponse: JetstreamResponse, requestUrl: string): HandledMultiEndpointResponse {
  if (!jetstreamResponse) {
    return null;
  }
  return Object.keys(jetstreamResponse).reduce((multiResponses, endpointGuid) => {
    const jetstreamEndpointResponse = jetstreamResponse[endpointGuid];
    const jetStreamError = isJetStreamError(jetstreamEndpointResponse || null);
    if (jetStreamError) {
      multiResponses.errors.push(
        buildJetstreamError(jetstreamEndpointResponse as JetStreamErrorResponse, endpointGuid, requestUrl)
      );
    } else {
      multiResponses.successes.push(jetstreamEndpointResponse);
    }
    return multiResponses;
  }, {
      errors: [],
      successes: []
    });
}


export const handleMultiEndpointsPipeFactory = (requestUrl: string) => (
  resData: JetstreamResponse
): HandledMultiEndpointResponse => {
  console.log(resData);
  const responses = mapResponses(resData, requestUrl);
  if (!responses || !responses.successes.length && !responses.successes.length) {
    return null;
  }
  return responses;
};

function getJetstreamErrorInformation(jetstreamErrorResponse: JetStreamErrorResponse): JetStreamErrorInformation {
  const errorResponse =
    jetstreamErrorResponse &&
      (!!jetstreamErrorResponse.errorResponse &&
        typeof jetstreamErrorResponse.errorResponse !== 'string')
      ? jetstreamErrorResponse.errorResponse
      : ({} as JetStreamErrorInformation);
  return {
    code: 0,
    description: 'Unknown',
    error_code: '0',
    ...errorResponse
  };
}

function buildJetstreamError(
  jetstreamErrorResponse: JetStreamErrorResponse,
  endpointGuid: string,
  requestUrl: string
) {
  const errorCode = jetstreamErrorResponse && jetstreamErrorResponse.error
    ? jetstreamErrorResponse.error.statusCode.toString()
    : '500';

  return new JetstreamError(
    errorCode,
    endpointGuid,
    requestUrl,
    getJetstreamErrorInformation(jetstreamErrorResponse),
  );
}

    // function getEntities(
  //   apiAction: EntityRequestAction,
  //   data: any,
  //   errorCheck: JetstreamError[],
  // ): {
  //   entities: NormalizedResponse;
  //   totalResults: number;
  //   totalPages: number;
  // } {
  //   let totalResults = 0;
  //   let totalPages = 0;
  //   const allEntities = Object.keys(data)
  //     .filter(
  //       guid =>
  //         data[guid] !== null &&
  //         errorCheck.findIndex(error => error.guid === guid && !error.error) >=
  //         0,
  //     )
  //     .map(cfGuid => {
  //       const cfData = data[cfGuid];
  //       switch (apiAction.entityLocation) {
  //         case RequestEntityLocation.ARRAY: // The response is an array which contains the entities
  //           const keys = Object.keys(cfData);
  //           totalResults = keys.length;
  //           totalPages = 1;
  //           return keys.map(key => {
  //             const guid = apiAction.guid + '-' + key;
  //             const result = completeResourceEntity(
  //               cfData[key],
  //               cfGuid,
  //               guid,
  //             );
  //             result.entity.guid = guid;
  //             return result;
  //           });
  //         case RequestEntityLocation.OBJECT: // The response is the entity
  //           return completeResourceEntity(cfData, cfGuid, apiAction.guid);
  //         case RequestEntityLocation.RESOURCE: // The response is an object and the entities list is within a 'resource' param
  //         default:
  //           if (!cfData.resources) {
  //             // Treat the response as RequestEntityLocation.OBJECT
  //             return completeResourceEntity(
  //               cfData,
  //               cfGuid,
  //               apiAction.guid,
  //             );
  //           }
  //           totalResults += cfData.total_results;
  //           totalPages += cfData.total_pages;
  //           if (!cfData.resources.length) {
  //             return null;
  //           }
  //           return cfData.resources.map(resource => {
  //             return completeResourceEntity(
  //               resource,
  //               cfGuid,
  //               resource.guid,
  //             );
  //           });
  //       }
  //     });
  //   const flatEntities = [].concat(...allEntities).filter(e => !!e);

  //   // TODO This need tidying up.
  //   let entityArray;
  //   const pagAction = apiAction as PaginatedAction;
  //   if (pagAction.__forcedPageEntityConfig__) {
  //     const entityConfig = pagAction.__forcedPageEntityConfig__;
  //     const schema = entityCatalogue.getEntity(entityConfig.endpointType, entityConfig.entityType).getSchema(entityConfig.schemaKey);
  //     entityArray = [schema];
  //   } else {
  //     // No need to do this, use Array.isArray - nj
  //     /* tslint:disable-next-line:no-string-literal  */
  //     if (apiAction.entity['length'] > 0) {
  //       entityArray = apiAction.entity;
  //     } else {
  //       entityArray = new Array<Schema>();
  //       entityArray.push(apiAction.entity);
  //     }
  //   }

  //   return {
  //     entities: flatEntities.length
  //       ? normalize(flatEntities, entityArray)
  //       : null,
  //     totalResults,
  //     totalPages,
  //   };
  // }

  // function completeResourceEntity(
  //   resource: APIResource | any,
  //   cfGuid: string,
  //   guid: string,
  // ): APIResource {
  //   if (!resource) {
  //     return resource;
  //   }

  //   const result = resource.metadata
  //     ? {
  //       entity: { ...resource.entity, guid: resource.metadata.guid, cfGuid },
  //       metadata: resource.metadata,
  //     }
  //     : {
  //       entity: { ...resource, cfGuid },
  //       metadata: { guid },
  //     };

  //   // Inject `cfGuid` in nested entities
  //   Object.keys(result.entity).forEach(resourceKey => {
  //     const nestedResource = result.entity[resourceKey];
  //     if (instanceOfAPIResource(nestedResource)) {
  //       result.entity[resourceKey] = completeResourceEntity(
  //         nestedResource,
  //         cfGuid,
  //         nestedResource.metadata.guid,
  //       );
  //     } else if (Array.isArray(nestedResource)) {
  //       result.entity[resourceKey] = nestedResource.map(nested => {
  //         return nested && typeof nested === 'object'
  //           ? completeResourceEntity(
  //             nested,
  //             cfGuid,
  //             nested.metadata
  //               ? nested.metadata.guid
  //               : guid + '-' + resourceKey,
  //           )
  //           : nested;
  //       });
  //     }
  //   });

  //   return result;
  // }


