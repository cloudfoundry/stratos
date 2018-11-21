import { APIResource, EntityInfo } from '../../../store/types/api.types';

export const isTCPRoute = (route: APIResource) => route.entity.port !== null && route.entity.port !== '';

export interface Domain {
  name: string;
}
export const getRoute = (
  route: APIResource,
  browsable: boolean = false,
  secure: boolean = false,
  domain: EntityInfo
) => {
  if (!route) {
    return;
  }
  let protocol = '';
  if (browsable) {
    protocol = secure ? 'https://' : 'http://';
  }
  if (route.entity.port) {
    // Note: Hostname and path are not supported for TCP routes
    return `${protocol}${domain.entity.name}:${route.entity.port}`;
  }
  const path = route.entity.path && route.entity.path.length && route.entity.path[0] !== `/` ? `/${route.entity.path}` : route.entity.path;
  return `${protocol}${route.entity.host}.${domain.entity.name}${path}`;
};

export const getMappedApps = (route: APIResource): APIResource[] => {
  return route.entity.apps || [];
};
