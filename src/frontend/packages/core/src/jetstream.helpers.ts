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

// TODO It would be nice if the BE could return a unique para for us to check for.
// There is always a chance that this will return a false positive (more so with extensions).
export function hasJetStreamError(pages: Partial<JetStreamErrorResponse>[]) {
  return pages.find(page => {
    return !!(
      page &&
      page.error &&
      page.error.status &&
      page.error.statusCode &&
      'errorResponse' in page
    );
  });
}

