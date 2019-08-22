import { hasJetStreamError, JetStreamErrorResponse } from '../../../../core/src/jetstream.helpers';
import { JetstreamResponse, PagedJetstreamResponse } from '../entity-request-pipeline.types';
import { PaginationPageIteratorConfig } from '../pagination-request-base-handlers/pagination-iterator.pipe';

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

function mapResponses(
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
        buildJetstreamError(jetStreamError as JetStreamErrorResponse, endpointGuid, requestUrl)
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

function getAllEntitiesFromResponses(response: any[], getEntitiesFromResponse?: (response: any) => any) {
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
  response: JetstreamResponse<any>[],
  endpointGuid: string,
  flattenerConfig: PaginationPageIteratorConfig<any, any>
): MultiEndpointResponse<any> {
  const entities = getAllEntitiesFromResponses(response, flattenerConfig ? flattenerConfig.getEntitiesFromResponse : null);

  if (Array.isArray(entities)) {
    return {
      endpointGuid,
      entities,
      totalPages: flattenerConfig ? flattenerConfig.getTotalPages(response) : 0,
      totalResults: flattenerConfig ? flattenerConfig.getTotalEntities(response) : 0
    };
  }
  return {
    endpointGuid,
    entities: [entities],
    totalPages: null,
    totalResults: 1
  };
}

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
export const handleMultiEndpointsPipeFactory = (
  requestUrl: string,
  flattenerConfig?: PaginationPageIteratorConfig<any, any>
) => (resData: PagedJetstreamResponse): HandledMultiEndpointResponse => {
  return mapResponses(resData, requestUrl, flattenerConfig);
};
