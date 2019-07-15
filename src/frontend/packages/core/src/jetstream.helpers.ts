export interface JetStreamErrorResponse {
  error: {
    status: string;
    statusCode: number;
  };
  errorResponse: any;
}

export function getJetStreamError(obj: Partial<JetStreamErrorResponse>): JetStreamErrorResponse {
  return obj &&
    obj.error && obj.error.status && obj.error.statusCode &&
    'errorResponse' in obj ?
    obj as JetStreamErrorResponse : null;
}

export function isJetStreamError(obj: Partial<JetStreamErrorResponse>): boolean {
  return !!(
    obj &&
    obj.error &&
    obj.error.status &&
    obj.error.statusCode &&
    'errorResponse' in obj
  );
}

