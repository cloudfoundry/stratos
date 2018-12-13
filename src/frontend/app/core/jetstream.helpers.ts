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
    obj.errorResponse ?
    obj as JetStreamError : null;
}
