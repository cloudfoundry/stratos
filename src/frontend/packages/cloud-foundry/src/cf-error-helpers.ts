import { type JetStreamErrorResponse, jetStreamErrorResponseToSafeString } from '../../store/src/jetstream';

export interface CfErrorObject {
  code: number;
  description: string;
  error_code: string;
}

/**
 * This is the raw response when making a request to a cf. Could be an error object created by cf, a stratos error string or anything
 */
export type CfErrorResponse = CfErrorObject | string | unknown;

function isCfError(errorResponse: CfErrorResponse): CfErrorObject | null {
  if (!errorResponse || typeof errorResponse !== 'object') {
    return null;
  }
  const err = errorResponse as Record<string, unknown>;
  return err.code && err.description && err.error_code ?
    errorResponse as CfErrorObject :
    null;
}

export function getCfError(jetStreamErrorResponse: JetStreamErrorResponse<CfErrorResponse>): string {
  const cfError = isCfError(jetStreamErrorResponse.errorResponse);
  if (cfError) {
    return `${cfError.description}. Code: ${cfError.error_code}`;
  } else if (typeof jetStreamErrorResponse.errorResponse === 'string') {
    return jetStreamErrorResponse.errorResponse;
  } else if (jetStreamErrorResponseToSafeString(jetStreamErrorResponse)) {
    return jetStreamErrorResponseToSafeString(jetStreamErrorResponse);
  } else {
    return `Unknown Cloud Foundry Error`;
  }
}
