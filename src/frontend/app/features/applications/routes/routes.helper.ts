import { APIResource, EntityInfo } from './../../../store/types/api.types';

export const isTCPRoute = (route: APIResource) =>
  route.entity.port !== null && route.entity.port !== '';

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
  } else if (route.entity.path) {
    return `${protocol}${route.entity.host}.${domain.entity.name}/${
      route.entity.path
    }`;
  } else {
    return `${protocol}${route.entity.host}.${domain.entity.name}`;
  }
};

export const getMappedApps = (route: APIResource): APIResource[] => {
  return route.entity.apps || [];
};
