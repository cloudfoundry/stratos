import type { APIResource } from '@stratosui/store';

export const isTCPRoute = (port: number | string | null | undefined): boolean => {
  if (port === null || port === undefined) {
    return false;
  }
  if (typeof port === 'string') {
    return port !== '';
  }
  return port > 0;
};

export interface Domain {
  name: string;
}
/**
 * Create a url from a route. Note - Called from both IRoute and IAppSummaryRoute sources
 */
export const getRoute = (
  routePort: number | null | undefined,
  routeHost: string,
  routePath: string,
  browsable: boolean = false,
  secure: boolean = false,
  domain: string
) => {
  let protocol = '';
  if (browsable) {
    protocol = secure ? 'https://' : 'http://';
  }
  if (routePort) {
    // Note: Hostname and path are not supported for TCP routes
    return `${protocol}${domain}:${routePort}`;
  }
  const path = routePath?.length && routePath[0] !== `/` ? `/${routePath}` : routePath;
  return `${protocol}${routeHost}.${domain}${path}`;
};

export const getMappedApps = (route: APIResource): APIResource[] => {
  const entity = route.entity as { apps?: APIResource[] };
  return entity.apps || [];
};
