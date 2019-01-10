export interface JetStreamError {
  error: {
    status: string;
    statusCode: number;
  };
  errorResponse: any;
}

export function isJetStreamError(obj): JetStreamError {
  return obj &&
    obj.error && obj.error.status && obj.error.statusCode &&
    'errorResponse' in obj ?
    obj as JetStreamError : null;
}
