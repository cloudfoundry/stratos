import { APIResource } from '../../../../../store/src/types/api.types';

export const isTCPRoute = (port: string) => port !== null && port !== '';

export interface Domain {
  name: string;
}
/**
 * Create a url from a route. Note - Called from both IRoute and IAppSummaryRoute sources
 */
export const getRoute = (
  routePort: any,
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
  const path = routePath && routePath.length && routePath[0] !== `/` ? `/${routePath}` : routePath;
  return `${protocol}${routeHost}.${domain}${path}`;
};

export const getMappedApps = (route: APIResource): APIResource[] => {
  return route.entity.apps || [];
};
