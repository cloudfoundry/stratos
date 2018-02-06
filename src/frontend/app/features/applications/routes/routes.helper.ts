import { APIResource } from './../../../store/types/api.types';

export const isTCPRoute = (route: APIResource) =>
  route.entity.port !== null && route.entity.port !== '';

export const getRoute = (
  route: APIResource,
  browsable: boolean = false,
  secure: boolean = false
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
    return `${protocol}${route.entity.domain &&
      route.entity.domain.entity.name}:${route.entity.port}`;
  } else if (route.entity.path) {
    return `${protocol}${route.entity.host}.${route.entity.domain &&
      route.entity.domain.entity.name}/${route.entity.path}`;
  } else {
    return `${protocol}${route.entity.host}.${route.entity.domain &&
      route.entity.domain.entity.name}`;
  }
};

export const getMappedApps = (route: APIResource): APIResource[] => {
  return route.entity.apps;
};
