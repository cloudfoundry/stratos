export interface JetStreamError {
  error: {
    status: string;
    statusCode: number;
  };
  errorResponse: any;
}

export function isJetStreamError(obj: Partial<JetStreamError>): JetStreamError {
  return obj &&
    obj.error && obj.error.status && obj.error.statusCode &&
    obj.errorResponse !== undefined ?
    obj as JetStreamError : null;
}
