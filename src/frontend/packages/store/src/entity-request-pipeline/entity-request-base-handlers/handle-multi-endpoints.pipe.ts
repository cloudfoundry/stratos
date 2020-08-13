import { NonJetstreamRequestHandler } from '../../entity-catalog/entity-catalog.types';
import { hasJetStreamError, JetStreamErrorResponse } from '../../jetstream';
import { PagedJetstreamResponse } from '../entity-request-pipeline.types';
import { PaginationPageIteratorConfig } from '../pagination-request-base-handlers/pagination-iterator.pipe';
import { stratosEndpointGuidKey } from '../pipeline.types';

/**
 * Generic container for information about an errored request to a specific endpoint
 */
export class JetstreamError<T = any> {
  constructor(
    public errorCode: string,
    public guid: string,
    public url: string,
    /**
     * Actual content of response from backend
     */
    public jetstreamErrorResponse: JetStreamErrorResponse<T>
  ) { }
}

export interface MultiEndpointResponse<T> {
  endpointGuid: string;
  entities: T;
  totalPages: number;
  totalResults: number;
}
export interface HandledMultiEndpointResponse<T = any> {
  errors: JetstreamError[];
  successes: MultiEndpointResponse<T>[];
}

function mapJetstreamResponses(
  jetstreamResponse: PagedJetstreamResponse,
  requestUrl: string,
  flattenerConfig: PaginationPageIteratorConfig<any, any>
  // getEntitiesFromResponse?: (response: any) => any
): HandledMultiEndpointResponse<any> {
  const baseResponse = {
    errors: [],
    successes: []
  } as HandledMultiEndpointResponse<any>;
  if (!jetstreamResponse) {
    return baseResponse;
  }
  return Object.keys(jetstreamResponse).reduce((multiResponses, endpointGuid) => {
    const jetstreamEndpointResponse = jetstreamResponse[endpointGuid];

    const jetStreamError = hasJetStreamError(jetstreamEndpointResponse as JetStreamErrorResponse[]);
    if (jetStreamError) {
      multiResponses.errors.push(
        buildJetstreamError(jetStreamError, endpointGuid, requestUrl)
      );
    } else {
      multiResponses.successes = multiResponses.successes.concat(postProcessSuccessResponses(
        // Array for entity requests, Pagination Response in an array for pagination requests
        jetstreamEndpointResponse as any[],
        endpointGuid,
        flattenerConfig
      ));
    }
    return multiResponses;
  }, baseResponse);
}

function getAllEntitiesFromResponses(response: any, getEntitiesFromResponse?: (response: any) => any) {
  if (!Array.isArray(response)) {
    return response;
  }
  if (getEntitiesFromResponse) {
    return response.reduce((merged, res) => {
      const entities = getEntitiesFromResponse(res);
      if (Array.isArray(entities)) {
        return [
          ...merged,
          ...entities
        ];
      }
      return [
        ...merged,
        entities
      ];
    }, []);
  }
  return response;
}

function postProcessSuccessResponses(
  response: any,
  endpointGuid: string,
  flattenerConfig: PaginationPageIteratorConfig<any, any>
): MultiEndpointResponse<any> {
  const entities = getAllEntitiesFromResponses(response, flattenerConfig ? flattenerConfig.getEntitiesFromResponse : null);
  const jetStreamResponse = {
    [endpointGuid]: response
  };
  if (Array.isArray(entities)) {
    return {
      endpointGuid,
      entities: entities.map(entity => ({
        ...entity,
        [stratosEndpointGuidKey]: endpointGuid
      })),
      totalPages: flattenerConfig ? flattenerConfig.getTotalPages(jetStreamResponse) : 0,
      totalResults: flattenerConfig ? flattenerConfig.getTotalEntities(jetStreamResponse) : 0
    };
  }
  return {
    endpointGuid,
    entities: [{
      ...entities,
      [stratosEndpointGuidKey]: endpointGuid
    }],
    totalPages: null,
    totalResults: 1
  };
}


function buildJetstreamError(
  jetstreamErrorResponse: JetStreamErrorResponse,
  endpointGuid: string,
  requestUrl: string
): JetstreamError {
  const errorCode = jetstreamErrorResponse && jetstreamErrorResponse.error
    ? jetstreamErrorResponse.error.statusCode.toString()
    : '500';

  return new JetstreamError(
    errorCode,
    endpointGuid,
    requestUrl,
    jetstreamErrorResponse,
  );
}
export const handleJetstreamResponsePipeFactory = (
  requestUrl: string,
  flattenerConfig?: PaginationPageIteratorConfig<any, any>
) => (resData: PagedJetstreamResponse): HandledMultiEndpointResponse => {
  return mapJetstreamResponses(resData, requestUrl, flattenerConfig);
};

export const handleNonJetstreamResponsePipeFactory = (
  requestUrl: string,
  nonJetstreamRequestHandler?: NonJetstreamRequestHandler,
  flattenerConfig?: PaginationPageIteratorConfig<any, any>
) => (resData: any): HandledMultiEndpointResponse => {
  const isSuccess = nonJetstreamRequestHandler ? nonJetstreamRequestHandler.isSuccess(resData) : true;
  const mappedRes = postProcessSuccessResponses(resData, null, flattenerConfig);
  if (isSuccess) {
    return {
      successes: [mappedRes],
      errors: []
    };
  }
  const errorCode = nonJetstreamRequestHandler && nonJetstreamRequestHandler.getErrorCode ?
    nonJetstreamRequestHandler.getErrorCode(resData) : '500';
  return {
    successes: [],
    errors: [new JetstreamError(errorCode, null, requestUrl, null)]
  };
};
