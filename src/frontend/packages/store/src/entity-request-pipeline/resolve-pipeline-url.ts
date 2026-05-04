export interface ResolvedPipelineUrl {
  url: string;
  isAbsolute: boolean;
}

export function resolvePipelineUrl(
  actionUrl: string,
  proxyAPIVersion: string,
  cfAPIVersion: string,
): ResolvedPipelineUrl {
  if (actionUrl.startsWith('/')) {
    return { url: actionUrl, isAbsolute: true };
  }
  return {
    url: `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${actionUrl}`,
    isAbsolute: false,
  };
}
