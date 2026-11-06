// Minimal St* entity builders for foundation-shape specs.
import {
  StApp,
  StOrg,
  StServiceCredentialBinding,
  StServiceInstance,
  StSpace,
  StUser,
} from '../../../services/endpoint-data/stratos-types';

export const org = (guid: string): StOrg => ({
  guid,
  name: `org-${guid}`,
  status: 'active',
  quotaGuid: '',
  labels: {},
  annotations: {},
  createdAt: '',
  updatedAt: '',
  cnsiGuid: 'cnsi-1',
});

export const space = (guid: string, orgGuid: string): StSpace => ({
  guid,
  name: `space-${guid}`,
  orgGuid,
  createdAt: '',
  updatedAt: '',
  cnsiGuid: 'cnsi-1',
  appCount: 0,
  routeCount: 0,
  allowSsh: false,
});

export const app = (guid: string, overrides: Partial<StApp>): StApp => ({
  guid,
  name: `app-${guid}`,
  state: 'STARTED',
  spaceGuid: '',
  instances: 1,
  routes: [],
  createdAt: '',
  updatedAt: '',
  cnsiGuid: 'cnsi-1',
  ...overrides,
});

export const user = (username: string, overrides: Partial<StUser> = {}): StUser => ({
  guid: `u-${username}`,
  username,
  cnsiGuid: 'cnsi-1',
  orgRoles: [],
  spaceRoles: [],
  ...overrides,
});

export const serviceInstance = (guid: string, spaceGuid: string, overrides: Partial<StServiceInstance> = {}): StServiceInstance => ({
  guid,
  cnsiGuid: 'cnsi-1',
  name: `si-${guid}`,
  type: 'managed',
  tags: [],
  lastOperation: {},
  space: { guid: spaceGuid },
  createdAt: '',
  ...overrides,
});

export const binding = (guid: string, appGuid: string, siGuid: string): StServiceCredentialBinding => ({
  guid,
  cnsiGuid: 'cnsi-1',
  type: 'app',
  serviceInstance: { guid: siGuid, name: `si-${siGuid}` },
  app: { guid: appGuid },
  createdAt: '',
});
